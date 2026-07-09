import { NextRequest, NextResponse } from 'next/server';
import { enviarCorreoSuperadmin } from '@/lib/correo';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const TestSMTPSchema = z.object({
  destinatario: z.string().email('Debe indicar un correo electrónico de prueba válido')
});

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = TestSMTPSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { destinatario } = validacion.data;

    const resultado = await enviarCorreoSuperadmin({
      destinatario,
      asunto: `[Prueba SMTP] Diagnóstico de conectividad - ERP Panamá`,
      cuerpoLibre: `<div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;">
        <h2 style="color:#00f0ff;background:#0b111e;padding:12px;border-radius:4px;margin-top:0;">Prueba Exitoso - Servidor SMTP de ERP Panamá</h2>
        <p>Este es un correo de comprobación enviado por el Superadministrador desde el módulo de configuración de SMTP.</p>
        <p><strong>Hora de envío:</strong> ${new Date().toLocaleString('es-PA')}</p>
        <p>Si has recibido este mensaje, el servidor saliente y las credenciales están verificados y operando al 100%.</p>
      </div>`
    });

    await registrarLogAuditoria({
      adminId,
      accion: 'TEST_SMTP_SALIENTE',
      objetivo: 'ConfiguracionSMTP',
      detalles: { destinatario, exito: resultado.success, mensaje: resultado.message }
    });

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.message }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Correo de prueba enviado con éxito a ${destinatario}. Registro guardado en CorreoEnviado.`
    });
  } catch (error: any) {
    console.error('Error POST /api/admin/configuracion/smtp-test:', error);
    return NextResponse.json({ error: error.message || 'Error en prueba SMTP' }, { status: 500 });
  }
}
