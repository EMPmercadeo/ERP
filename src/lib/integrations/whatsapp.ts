import { prisma } from '../db';

const WHATSAPP_API_VERSION = 'v20.0';

interface EnviarWhatsAppFacturaParams {
    empresaId: string;
    clienteId: string;
    facturaId: string;
    numeroFactura: string;
    total: number;
}

export async function enviarWhatsAppFactura(params: EnviarWhatsAppFacturaParams) {
    const { empresaId, clienteId, facturaId, numeroFactura, total } = params;

    const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { whatsappPhone: true, whatsappToken: true }
    });

    if (!empresa?.whatsappPhone || !empresa?.whatsappToken) {
        return { success: false, message: 'WhatsApp API no está configurada para esta empresa.' };
    }

    const cliente = await prisma.cliente.findFirst({
        where: { id: clienteId, empresaId },
        select: { telefono: true, razonSocial: true }
    });

    if (!cliente?.telefono) {
        return { success: false, message: 'El cliente no tiene un teléfono registrado.' };
    }

    const to = cliente.telefono.replace(/[^\d]/g, '');
    const mensaje = `Hola ${cliente.razonSocial}, tu factura ${numeroFactura} por $${total.toFixed(2)} ha sido generada. ¡Gracias por tu compra!`;

    try {
        // WhatsApp Cloud API exige mensajes iniciados por el negocio como "template" pre-aprobado
        // fuera de la ventana de 24h de conversación; se usa 'text' aquí porque no conocemos
        // el nombre del template real del cliente. Cambiar a type "template" una vez que la
        // empresa registre y apruebe una plantilla en Meta Business Manager.
        const response = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${empresa.whatsappPhone}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${empresa.whatsappToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: mensaje }
                }),
                signal: AbortSignal.timeout(10000)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(`WhatsApp API error para factura ${facturaId}:`, data);
            return { success: false, message: data?.error?.message || 'Error al enviar el mensaje de WhatsApp.' };
        }

        return { success: true, message: 'Mensaje de WhatsApp enviado.', data };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error de red al enviar WhatsApp.';
        console.error(`Error de red enviando WhatsApp para factura ${facturaId}:`, message);
        return { success: false, message };
    }
}
