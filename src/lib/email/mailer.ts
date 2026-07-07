import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Envío de correo transaccional vía SMTP genérico — funciona con cualquier proveedor:
// tu propio servidor SMTP, Google Workspace (SMTP relay), Resend (también expone SMTP),
// Zoho, etc. No hay dependencia de un SDK propietario: basta con cambiar las variables
// de entorno para cambiar de proveedor sin tocar código.
//
// Variables de entorno requeridas (configurar en Vercel, nunca hardcodear credenciales):
// - SMTP_HOST: host del servidor SMTP
//     Ej. Google Workspace: smtp-relay.gmail.com
//     Ej. servidor propio: mail.tudominio.com
// - SMTP_PORT: puerto (587 = STARTTLS, recomendado; 465 = SSL directo)
// - SMTP_SECURE: "true" si el puerto es 465 (SSL), "false" u omitir para 587 (STARTTLS)
// - SMTP_USER: usuario/cuenta para autenticar contra el servidor SMTP
// - SMTP_PASSWORD: contraseña o contraseña de aplicación
// - SMTP_FROM_EMAIL: remitente, formato "Nombre <correo@dominio-verificado.com>"
//
// Mientras no estén configuradas, `sendEmail()` devuelve un error claro en vez de
// fallar de forma silenciosa o simulada — mismo patrón de "kill switch" ya usado en
// src/lib/integrations/whatsapp.ts y src/lib/integrations/webhooks.ts.

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    if (!host || !user || !password) return null;

    if (!transporter) {
        const port = Number(process.env.SMTP_PORT || 587);
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;
        transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass: password },
        });
    }
    return transporter;
}

export function isEmailConfigured(): boolean {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD &&
        process.env.SMTP_FROM_EMAIL
    );
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
    const client = getTransporter();
    const fromEmail = process.env.SMTP_FROM_EMAIL;

    if (!client || !fromEmail) {
        return {
            success: false,
            message: 'El envío de correo no está configurado (falta SMTP_HOST, SMTP_USER, SMTP_PASSWORD o SMTP_FROM_EMAIL). Configúralo en las variables de entorno de Vercel.',
        };
    }

    try {
        const info = await client.sendMail({
            from: fromEmail,
            to: params.to,
            subject: params.subject,
            html: params.html,
            replyTo: params.replyTo,
        });

        return { success: true, message: 'Correo enviado correctamente.', id: info.messageId };
    } catch (error) {
        console.error('Error enviando correo por SMTP:', error);
        const message = error instanceof Error ? error.message : 'No se pudo enviar el correo en este momento.';
        return { success: false, message };
    }
}
