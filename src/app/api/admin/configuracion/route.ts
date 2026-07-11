import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { encrypt as cifrar } from '@/lib/utils/crypto';
import { z } from 'zod';

const ConfigSMTPSchema = z.object({
  servidor: z.string().min(3),
  puerto: z.number().int().default(587),
  usuario: z.string().min(1),
  passwordCifrado: z.string().min(1),
  remitente: z.string().email(),
  activo: z.boolean().default(true)
});

export async function GET(_request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const smtp = await prisma.configuracionSMTP.findFirst({
      orderBy: { actualizadoEn: 'desc' }
    });

    return NextResponse.json({
      plataforma: {
        nombre: process.env.NEXT_PUBLIC_APP_NAME || 'ERP Panamá',
        correoContacto: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'soporte@erppanama.com',
        telefonoSoporte: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+507 800-0000',
        modoMantenimiento: process.env.MAINTENANCE_MODE === 'true'
      },
      smtp: smtp ? {
        id: smtp.id,
        servidor: smtp.servidor,
        puerto: smtp.puerto,
        usuario: smtp.usuario,
        remitente: smtp.remitente,
        activo: smtp.activo,
        actualizadoEn: smtp.actualizadoEn,
        hasPassword: Boolean(smtp.passwordCifrado && smtp.passwordCifrado.length > 0),
        passwordMasked: '••••••••••••••••'
      } : null
    });
  } catch (error) {
    console.error('Error GET /api/admin/configuracion:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener configuración global' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const adminId = auth.context.userId;
    const body = await request.json();

    let modificadoSmtp = null;

    if (body.smtp) {
      const validacion = ConfigSMTPSchema.safeParse(body.smtp);
      if (!validacion.success) {
        return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
      }

      const existente = await prisma.configuracionSMTP.findFirst();
      if (existente) {
        modificadoSmtp = await prisma.configuracionSMTP.update({
          where: { id: existente.id },
          data: {
            ...validacion.data,
            passwordCifrado: validacion.data.passwordCifrado === '••••••••••••••••' ? existente.passwordCifrado : cifrar(validacion.data.passwordCifrado)
          }
        });
      } else {
        modificadoSmtp = await prisma.configuracionSMTP.create({
          data: {
            ...validacion.data,
            passwordCifrado: cifrar(validacion.data.passwordCifrado)
          }
        });
      }

      await registrarLogAuditoria({
        adminId,
        accion: 'ACTUALIZAR_CONFIGURACION_SMTP',
        objetivo: 'ConfiguracionSMTP',
        objetivoId: modificadoSmtp.id,
        detalles: { servidor: modificadoSmtp.servidor, puerto: modificadoSmtp.puerto, remitente: modificadoSmtp.remitente }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      smtp: modificadoSmtp ? {
        ...modificadoSmtp,
        passwordCifrado: '••••••••••••••••',
        hasPassword: true
      } : null
    });
  } catch (error) {
    console.error('Error PATCH /api/admin/configuracion:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al actualizar configuración' }, { status: 500 });
  }
}
