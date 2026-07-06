import { Resend } from 'resend';

// Cliente único de Resend para todo el proyecto (a diferencia de WhatsApp/webhooks,
// que son credenciales por empresa, el envío de email es infraestructura de la
// plataforma: un solo dominio remitente verificado para todos los tenants).
//
// Variables de entorno requeridas (configurar en Vercel, nunca hardcodear la API key):
// - RESEND_API_KEY: API key de Resend (https://resend.com/api-keys)
// - RESEND_FROM_EMAIL: remitente verificado, formato "Nombre <correo@dominio-verificado.com>"
//
// Mientras no estén configuradas, `sendEmail()` devuelve un error claro en vez de
// fallar de forma silenciosa o simulada — mismo patrón de "kill switch" ya usado en
// src/lib/integrations/whatsapp.ts y src/lib/integrations/webhooks.ts.

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    if (!resendClient) {
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

export function isEmailConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
}

export interface SendEmailResult {
    success: boolean;
    message: string;
    id?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const client = getResendClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!client || !fromEmail) {
        return {
            success: false,
            message: 'El envío de correo no está configurado (falta RESEND_API_KEY o RESEND_FROM_EMAIL). Configúralo en las variables de entorno de Vercel.',
        };
    }

    try {
        const { data, error } = await client.emails.send({
            from: fromEmail,
            to: params.to,
            subject: params.subject,
            html: params.html,
            replyTo: params.replyTo,
        });

        if (error) {
            console.error('Error enviando correo con Resend:', error);
            return { success: false, message: error.message || 'No se pudo enviar el correo.' };
        }

        return { success: true, message: 'Correo enviado correctamente.', id: data?.id };
    } catch (error) {
        console.error('Error inesperado enviando correo con Resend:', error);
        return { success: false, message: 'No se pudo enviar el correo en este momento.' };
    }
}
