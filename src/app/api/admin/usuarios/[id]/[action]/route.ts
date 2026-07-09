import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { enviarCorreoSuperadmin } from '@/lib/correo';
import { z } from 'zod';

const AjusteSaldoSchema = z.object({
  cantidad: z.number().int('La cantidad debe ser un entero'),
  nota: z.string().min(3, 'La nota explicativa es obligatoria para ajustes de saldo manuales')
});

const EnviarCorreoSchema = z.object({
  asunto: z.string().optional(),
  plantillaClave: z.string().optional(),
  plantillaId: z.string().optional(),
  cuerpoLibre: z.string().optional(),
  variables: z.record(z.string(), z.any()).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await params;
    const adminId = request.headers.get('x-admin-id') || 'SUPERADMIN';

    const cuenta = await prisma.cuenta.findUnique({ where: { id } });
    if (!cuenta) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    // 1. ACCIÓN: SUSPENDER
    if (action === 'suspender') {
      if (cuenta.estado === 'SUSPENDIDA') {
        return NextResponse.json({ error: 'La cuenta ya está suspendida' }, { status: 400 });
      }
      const modificada = await prisma.cuenta.update({
        where: { id },
        data: { estado: 'SUSPENDIDA' }
      });
      await registrarLogAuditoria({
        adminId,
        accion: 'SUSPENDER_CUENTA',
        objetivo: 'Cuenta',
        objetivoId: id,
        detalles: { empresa: cuenta.empresa, ruc: cuenta.ruc }
      });
      return NextResponse.json({ success: true, message: 'Cuenta suspendida correctamente', cuenta: modificada });
    }

    // 2. ACCIÓN: REACTIVAR
    if (action === 'reactivar') {
      if (cuenta.estado === 'ACTIVA') {
        return NextResponse.json({ error: 'La cuenta ya se encuentra activa' }, { status: 400 });
      }
      const modificada = await prisma.cuenta.update({
        where: { id },
        data: { estado: 'ACTIVA', eliminadoEn: null }
      });
      await registrarLogAuditoria({
        adminId,
        accion: 'REACTIVAR_CUENTA',
        objetivo: 'Cuenta',
        objetivoId: id,
        detalles: { empresa: cuenta.empresa, ruc: cuenta.ruc }
      });
      return NextResponse.json({ success: true, message: 'Cuenta reactivada y habilitada', cuenta: modificada });
    }

    // 3. ACCIÓN: IMPERSONAR
    if (action === 'impersonar') {
      await registrarLogAuditoria({
        adminId,
        accion: 'IMPERSONAR_CUENTA',
        objetivo: 'Cuenta',
        objetivoId: id,
        detalles: { empresa: cuenta.empresa, correo: cuenta.correo }
      });
      return NextResponse.json({
        success: true,
        impersonationToken: `impersonate_${id}_${Date.now()}`,
        targetAccount: {
          id: cuenta.id,
          empresa: cuenta.empresa,
          correo: cuenta.correo,
          ruc: cuenta.ruc
        },
        message: `Impersonación iniciada para ${cuenta.empresa}. Se mostrará el banner de sesión superadmin.`
      });
    }

    // 4. ACCIÓN: CORREO (enviar correo individual a este cliente)
    if (action === 'correo') {
      const body = await request.json().catch(() => ({}));
      const validacion = EnviarCorreoSchema.safeParse(body);
      if (!validacion.success) {
        return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
      }

      const resultado = await enviarCorreoSuperadmin({
        cuentaId: id,
        destinatario: cuenta.correo,
        asunto: validacion.data.asunto || `Notificación ERP Panamá para ${cuenta.empresa}`,
        plantillaClave: validacion.data.plantillaClave,
        plantillaId: validacion.data.plantillaId,
        cuerpoLibre: validacion.data.cuerpoLibre,
        variables: {
          nombre: cuenta.nombre,
          empresa: cuenta.empresa,
          ruc: cuenta.ruc,
          saldo: cuenta.saldoFacturas,
          ...(validacion.data.variables || {})
        }
      });

      await registrarLogAuditoria({
        adminId,
        accion: 'ENVIAR_CORREO_INDIVIDUAL',
        objetivo: 'Cuenta',
        objetivoId: id,
        detalles: { destinatario: cuenta.correo, asunto: validacion.data.asunto, exito: resultado.success }
      });

      return NextResponse.json(resultado);
    }

    // 5. ACCIÓN: AJUSTE-SALDO (Ajuste manual del ledger de cuotas)
    if (action === 'ajuste-saldo') {
      const body = await request.json().catch(() => ({}));
      const validacion = AjusteSaldoSchema.safeParse(body);
      if (!validacion.success) {
        return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
      }

      const { cantidad, nota } = validacion.data;
      if (cantidad === 0) {
        return NextResponse.json({ error: 'La cantidad del ajuste no puede ser 0' }, { status: 400 });
      }

      const saldoAnte = cuenta.saldoFacturas;
      const saldoPost = saldoAnte + cantidad;

      if (saldoPost < 0) {
        return NextResponse.json({ error: `El ajuste excede el saldo disponible (${saldoAnte} cuotas). Saldo resultante no puede ser negativo.` }, { status: 400 });
      }

      // Transacción atómica Prisma: crea movimiento y actualiza saldo en cuenta
      const [movimiento, modificada] = await prisma.$transaction([
        prisma.movimientoCuota.create({
          data: {
            cuentaId: id,
            tipo: 'AJUSTE_MANUAL',
            cantidad,
            saldoAnte,
            saldoPost,
            nota: `[Superadmin] ${nota}`
          }
        }),
        prisma.cuenta.update({
          where: { id },
          data: { saldoFacturas: saldoPost }
        })
      ]);

      await registrarLogAuditoria({
        adminId,
        accion: 'AJUSTE_SALDO_MANUAL',
        objetivo: 'Cuenta',
        objetivoId: id,
        detalles: { cantidad, saldoAnte, saldoPost, nota }
      });

      return NextResponse.json({
        success: true,
        message: `Saldo ajustado exitosamente (${cantidad > 0 ? '+' : ''}${cantidad} cuotas). Nuevo saldo: ${saldoPost}`,
        movimiento,
        cuenta: modificada
      });
    }

    return NextResponse.json({ error: `Acción no reconocida: ${action}` }, { status: 404 });
  } catch (error: any) {
    console.error('Error POST /api/admin/usuarios/[id]/[action]:', error);
    return NextResponse.json({ error: error.message || 'Error en acción de usuario' }, { status: 500 });
  }
}
