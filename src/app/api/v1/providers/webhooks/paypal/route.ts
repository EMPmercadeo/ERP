import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getPayPalApiBase(): string {
    return process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Credenciales de PayPal (client id/secret) no configuradas.');
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        throw new Error(`No se pudo obtener el access token de PayPal (status ${res.status}).`);
    }

    const data = await res.json();
    return data.access_token as string;
}

interface PayPalWebhookHeaders {
    transmissionId: string;
    transmissionTime: string;
    certUrl: string;
    authAlgo: string;
    transmissionSig: string;
}

async function verifyPayPalWebhookSignature(headers: PayPalWebhookHeaders, webhookEvent: unknown): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        throw new Error('PAYPAL_WEBHOOK_ID no está configurada.');
    }

    const accessToken = await getPayPalAccessToken();

    const res = await fetch(`${getPayPalApiBase()}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transmission_id: headers.transmissionId,
            transmission_time: headers.transmissionTime,
            cert_url: headers.certUrl,
            auth_algo: headers.authAlgo,
            transmission_sig: headers.transmissionSig,
            webhook_id: webhookId,
            webhook_event: webhookEvent,
        }),
    });

    if (!res.ok) {
        console.error(`[PayPal Webhook] verify-webhook-signature respondió status ${res.status}`);
        return false;
    }

    const data = await res.json();
    return data.verification_status === 'SUCCESS';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Verificación real de firma: PayPal exige estos 5 headers en cada notificación
        const transmissionId = request.headers.get('paypal-transmission-id');
        const transmissionSig = request.headers.get('paypal-transmission-sig');
        const transmissionTime = request.headers.get('paypal-transmission-time');
        const certUrl = request.headers.get('paypal-cert-url');
        const authAlgo = request.headers.get('paypal-auth-algo');
        if (!transmissionId || !transmissionSig || !transmissionTime || !certUrl || !authAlgo) {
            console.warn('[PayPal Webhook] Missing verification headers');
            return NextResponse.json({ error: 'Missing webhook verification headers' }, { status: 401 });
        }

        let isValid = false;
        try {
            isValid = await verifyPayPalWebhookSignature(
                { transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig },
                body
            );
        } catch (verifyError) {
            console.error('[PayPal Webhook] Error verificando firma:', verifyError);
            return NextResponse.json({ error: 'Error verificando la firma del webhook.' }, { status: 401 });
        }

        if (!isValid) {
            console.warn('[PayPal Webhook] Firma inválida, evento rechazado.');
            return NextResponse.json({ error: 'Firma de webhook inválida.' }, { status: 401 });
        }

        const { event_type, resource } = body;

        console.log(`[PayPal Webhook] Recibido evento: ${event_type}`, JSON.stringify(resource));

        if (!resource) {
            return NextResponse.json({ error: 'Payload de recurso inválido.' }, { status: 400 });
        }

        // Obtener el identificador de la empresa (custom_id que guardamos al crear la suscripción)
        const empresaId = resource.custom_id || resource.custom;

        if (!empresaId) {
            console.warn('[PayPal Webhook] No se encontró custom_id (empresaId) en el recurso.');
            return NextResponse.json({ error: 'Falta empresaId (custom_id) en el recurso.' }, { status: 400 });
        }

        // Buscar si la empresa existe
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });

        if (!empresa) {
            console.error(`[PayPal Webhook] Empresa no encontrada: ${empresaId}`);
            return NextResponse.json({ error: 'Empresa no encontrada.' }, { status: 404 });
        }

        let planType = 'free';
        let subscriptionStatus = 'active';

        // Mapear los IDs de planes de PayPal a nuestros planes locales
        // El usuario puede configurar las variables de entorno:
        // NEXT_PUBLIC_PAYPAL_PLAN_BASIC_ID y NEXT_PUBLIC_PAYPAL_PLAN_PRO_ID
        const basicPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC_ID || 'P-MOCK-BASIC-PLAN';
        const proPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO_ID || 'P-MOCK-PRO-PLAN';

        if (resource.plan_id === basicPlanId) {
            planType = 'basic';
        } else if (resource.plan_id === proPlanId) {
            planType = 'pro';
        }

        switch (event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                subscriptionStatus = 'pending';
                break;
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
            case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
                subscriptionStatus = 'active';
                break;
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                subscriptionStatus = 'cancelled';
                planType = 'free'; // Downgrade a gratis al cancelar
                break;
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                subscriptionStatus = 'suspended';
                break;
            case 'BILLING.SUBSCRIPTION.EXPIRED':
                subscriptionStatus = 'expired';
                planType = 'free'; // Downgrade a gratis al expirar
                break;
            case 'PAYMENT.SALE.COMPLETED':
                // Pago recurrente exitoso, aseguramos que el estado de suscripción esté activo
                subscriptionStatus = 'active';
                // Si viene el plan_id, lo mapeamos
                if (resource.billing_agreement_id) {
                    // En venta completada, el recurso es una transacción de venta.
                    // Podemos verificar o dejar que siga activo.
                }
                break;
            default:
                console.log(`[PayPal Webhook] Evento no manejado: ${event_type}`);
                return NextResponse.json({ message: 'Evento no procesado, omitido.' });
        }

        // Actualizar la empresa
        const updatedCompany = await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                planType,
                subscriptionStatus,
                fiscalEnabled: planType !== 'free'
            }
        });

        // Crear registro de auditoría
        // Buscamos algún usuario administrador de esa empresa para asociar la auditoría
        const adminUser = await prisma.usuario.findFirst({
            where: { empresaId, rol: { in: ['admin', 'super_admin'] } }
        });

        if (adminUser) {
            await prisma.auditoria.create({
                data: {
                    usuarioId: adminUser.id,
                    entidad: 'Empresa',
                    entidadId: empresaId,
                    accion: 'editar',
                    datosDespues: {
                        planType,
                        subscriptionStatus,
                        event_type,
                        source: 'paypal-webhook'
                    }
                }
            });
        }

        console.log(`[PayPal Webhook] Empresa ${empresaId} actualizada exitosamente. Plan: ${planType}, Estado: ${subscriptionStatus}`);
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[PayPal Webhook] Error:', error);
        return NextResponse.json({ error: 'Error procesando el webhook de PayPal.' }, { status: 500 });
    }
}
