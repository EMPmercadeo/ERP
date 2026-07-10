// Verificación server-side de una suscripción de PayPal antes de otorgar un plan de pago.
//
// Por qué existe este archivo: el botón de PayPal en /settings ejecuta `onApprove` en el
// NAVEGADOR, y ese callback llamaba directamente a la server action `updateCompanyPlan`.
// Como las server actions de Next.js quedan expuestas como endpoints invocables, cualquier
// usuario autenticado podía llamar `updateCompanyPlan(miEmpresaId, 'pro')` desde la consola
// del navegador (o con curl) y activar un plan pagado SIN pagar nada — el servidor nunca
// confirmaba con PayPal que el pago realmente ocurrió. Este helper cierra ese hueco:
// antes de aplicar un upgrade se consulta la API real de PayPal para confirmar que la
// suscripción existe, está activa, y corresponde tanto a la empresa como al plan solicitado.

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

export async function verifyPayPalSubscription(
    subscriptionId: string | undefined | null,
    empresaId: string,
    expectedPlanId: string | undefined
): Promise<{ ok: boolean; reason?: string }> {
    if (!subscriptionId) {
        return { ok: false, reason: 'Falta el ID de suscripción de PayPal para verificar el pago.' };
    }

    try {
        const accessToken = await getPayPalAccessToken();
        const res = await fetch(`${getPayPalApiBase()}/v1/billing/subscriptions/${subscriptionId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!res.ok) {
            return { ok: false, reason: `PayPal respondió con estado ${res.status} al consultar la suscripción.` };
        }

        const sub = await res.json();

        if (sub.status !== 'ACTIVE' && sub.status !== 'APPROVED') {
            return { ok: false, reason: `La suscripción de PayPal no está activa (estado: ${sub.status}).` };
        }

        if (sub.custom_id && sub.custom_id !== empresaId) {
            return { ok: false, reason: 'La suscripción de PayPal no corresponde a esta empresa.' };
        }

        if (expectedPlanId && sub.plan_id !== expectedPlanId) {
            return { ok: false, reason: 'La suscripción de PayPal no corresponde al plan solicitado.' };
        }

        return { ok: true };
    } catch (error) {
        console.error('[verifyPayPalSubscription] Error:', error);
        return { ok: false, reason: 'Error al verificar la suscripción con PayPal.' };
    }
}
