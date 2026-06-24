import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
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

        await prisma.auditoria.create({
            data: {
                usuarioId: adminUser?.id || 'paypal-webhook',
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

        console.log(`[PayPal Webhook] Empresa ${empresaId} actualizada exitosamente. Plan: ${planType}, Estado: ${subscriptionStatus}`);
        return NextResponse.json({ success: true, planType, subscriptionStatus });
    } catch (error) {
        console.error('[PayPal Webhook] Error:', error);
        return NextResponse.json({ error: 'Error procesando el webhook de PayPal.' }, { status: 500 });
    }
}
