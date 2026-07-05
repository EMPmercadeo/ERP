import { prisma } from '../db';

export async function dispatchWebhookEvent(empresaId: string, event: string, data: Record<string, unknown>) {
    const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { webhookUrl: true, webhookToken: true }
    });

    if (!empresa?.webhookUrl) {
        return { success: false, message: 'Webhook no configurado para esta empresa.' };
    }

    try {
        const response = await fetch(empresa.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(empresa.webhookToken ? { Authorization: `Bearer ${empresa.webhookToken}` } : {})
            },
            body: JSON.stringify({
                event,
                empresaId,
                timestamp: new Date().toISOString(),
                data
            }),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            console.error(`Webhook "${event}" respondió ${response.status} para empresa ${empresaId}`);
            return { success: false, message: `El webhook respondió con estado ${response.status}.` };
        }

        return { success: true, message: 'Webhook entregado correctamente.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error de red al enviar webhook.';
        console.error(`Error enviando webhook "${event}" para empresa ${empresaId}:`, message);
        return { success: false, message };
    }
}
