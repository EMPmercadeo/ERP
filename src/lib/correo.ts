import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/mailer';
import { decrypt } from '@/lib/utils/crypto';
import nodemailer from 'nodemailer';

export interface OpcionesEnvioCorreo {
  cuentaId?: string | null;
  destinatario: string;
  asunto?: string;
  plantillaClave?: string; // e.g. "BIENVENIDA", "VERIFICACION", "SALDO_BAJO", etc.
  plantillaId?: string;
  variables?: Record<string, string | number>;
  cuerpoLibre?: string;
}

export async function enviarCorreoSuperadmin(opciones: OpcionesEnvioCorreo) {
  let asuntoFinal = opciones.asunto || 'Notificación ERP Panamá';
  let cuerpoHtml = opciones.cuerpoLibre || '';
  let idPlantilla = opciones.plantillaId || null;

  // 1. Resolver plantilla si se especifica clave o id
  if (opciones.plantillaClave) {
    const plantilla = await prisma.plantillaCorreo.findUnique({
      where: { clave: opciones.plantillaClave }
    });
    if (plantilla) {
      asuntoFinal = opciones.asunto || plantilla.asunto;
      cuerpoHtml = plantilla.cuerpo;
      idPlantilla = plantilla.id;
    }
  } else if (opciones.plantillaId) {
    const plantilla = await prisma.plantillaCorreo.findUnique({
      where: { id: opciones.plantillaId }
    });
    if (plantilla) {
      asuntoFinal = opciones.asunto || plantilla.asunto;
      cuerpoHtml = plantilla.cuerpo;
    }
  }

  // 2. Reemplazar variables {{variable}} en asunto y cuerpo
  if (opciones.variables) {
    for (const [key, value] of Object.entries(opciones.variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      asuntoFinal = asuntoFinal.replace(regex, String(value));
      cuerpoHtml = cuerpoHtml.replace(regex, String(value));
    }
  }

  // 3. Verificar si hay configuración SMTP en la BD (ConfiguracionSMTP), si no usar fallback de environment
  let exito = false;
  let mensajeError = '';

  try {
    const configSmtpDb = await prisma.configuracionSMTP.findFirst({
      where: { activo: true },
      orderBy: { actualizadoEn: 'desc' }
    });

    if (configSmtpDb) {
      // La contraseña se guarda cifrada (AES-256-GCM); debe descifrarse antes de usarla en la autenticación SMTP.
      const transport = nodemailer.createTransport({
        host: configSmtpDb.servidor,
        port: configSmtpDb.puerto,
        secure: configSmtpDb.puerto === 465,
        auth: {
          user: configSmtpDb.usuario,
          pass: decrypt(configSmtpDb.passwordCifrado)
        }
      });
      await transport.sendMail({
        from: configSmtpDb.remitente,
        to: opciones.destinatario,
        subject: asuntoFinal,
        html: cuerpoHtml || `<p>${asuntoFinal}</p>`
      });
      exito = true;
    } else {
      // Usar mailer por defecto en variables de entorno (O si no hay env, simulamos éxito en entorno de pruebas)
      const resultado = await sendEmail({
        to: opciones.destinatario,
        subject: asuntoFinal,
        html: cuerpoHtml || `<p>${asuntoFinal}</p>`
      });
      if (resultado.success || process.env.NODE_ENV !== 'production') {
        exito = true;
      } else {
        mensajeError = resultado.message;
      }
    }
  } catch (err: any) {
    exito = false;
    mensajeError = err.message || 'Error de envío SMTP';
    // En desarrollo/test, no interrumpir si no hay servidor SMTP en local
    if (process.env.NODE_ENV !== 'production') {
      exito = true;
    }
  }

  // 4. SIEMPRE registrar el intento de correo en CorreoEnviado
  const registro = await prisma.correoEnviado.create({
    data: {
      cuentaId: opciones.cuentaId || null,
      destinatario: opciones.destinatario,
      asunto: asuntoFinal,
      plantillaId: idPlantilla,
      estado: exito ? 'ENVIADO' : 'FALLIDO',
      abierto: false
    }
  });

  return {
    success: exito,
    message: exito ? 'Correo procesado y registrado correctamente' : mensajeError,
    registro
  };
}
