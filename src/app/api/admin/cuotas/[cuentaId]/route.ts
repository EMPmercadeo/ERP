import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const AjusteCuotaSchema = z.object({
  accion: z.enum(['ajustar', 'reconciliar', 'eliminar_saldo']),
  cantidad: z.number().int().optional(),
  nota: z.string().optional()
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ cuentaId: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { cuentaId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const tipo = searchParams.get('tipo'); // e.g. CREDITO_COMPRA, DEBITO_EMISION, AJUSTE_MANUAL, REEMBOLSO

    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      select: { id: true, nombre: true, empresa: true, ruc: true, saldoFacturas: true, estado: true }
    });

    if (!cuenta) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    const where: Prisma.MovimientoCuotaWhereInput = { cuentaId };
    if (tipo && tipo !== 'all') {
      where.tipo = tipo;
    }

    const movimientos = await paginar(prisma.movimientoCuota, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      cuenta,
      movimientos
    });
  } catch (error) {
    console.error('Error GET /api/admin/cuotas/[cuentaId]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener movimientos de cuota' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ cuentaId: string }> }) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { cuentaId } = await params;
    const adminId = auth.context.userId;
    const body = await request.json().catch(() => ({}));
    const validacion = AjusteCuotaSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
    if (!cuenta) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    // 1. RECONCILIAR
    if (validacion.data.accion === 'reconciliar') {
      const agregado = await prisma.movimientoCuota.aggregate({
        where: { cuentaId },
        _sum: { cantidad: true }
      });

      const sumaLedger = agregado._sum.cantidad || 0;
      const saldoActual = cuenta.saldoFacturas;
      const diferencia = saldoActual - sumaLedger;
      const discrepancia = diferencia !== 0;

      await registrarLogAuditoria({
        adminId,
        accion: 'RECONCILIAR_CUOTAS',
        objetivo: 'Cuenta',
        objetivoId: cuentaId,
        detalles: { sumaLedger, saldoActual, diferencia, discrepancia }
      });

      return NextResponse.json({
        reconciliado: !discrepancia,
        sumaLedger,
        saldoActual,
        diferencia,
        mensaje: discrepancia
          ? `Alerta: Discrepancia detectada. El libro de movimientos suma ${sumaLedger} cuotas, pero el saldo de cuenta es ${saldoActual} (Diferencia: ${diferencia}).`
          : 'El saldo de la cuenta está perfectamente sincronizado con la suma de todos los movimientos del ledger.'
      });
    }

    // 2. AJUSTAR
    if (validacion.data.accion === 'ajustar') {
      const cantidad = validacion.data.cantidad;
      const nota = validacion.data.nota;

      if (!cantidad || Math.abs(cantidad) === 0) {
        return NextResponse.json({ error: 'La cantidad a ajustar es obligatoria y distinta de 0' }, { status: 400 });
      }
      if (!nota || nota.trim().length < 3) {
        return NextResponse.json({ error: 'La nota explicativa es obligatoria para el ajuste' }, { status: 400 });
      }

      const saldoAnte = cuenta.saldoFacturas;
      const saldoPost = saldoAnte + cantidad;
      if (saldoPost < 0) {
        return NextResponse.json({ error: `El ajuste excede el saldo disponible (${saldoAnte}). Saldo no puede ser negativo.` }, { status: 400 });
      }

      const [movimiento, modificada] = await prisma.$transaction([
        prisma.movimientoCuota.create({
          data: {
            cuentaId,
            tipo: 'AJUSTE_MANUAL',
            cantidad,
            saldoAnte,
            saldoPost,
            nota: `[Superadmin Reconciliación] ${nota}`
          }
        }),
        prisma.cuenta.update({
          where: { id: cuentaId },
          data: { saldoFacturas: saldoPost }
        })
      ]);

      await registrarLogAuditoria({
        adminId,
        accion: 'AJUSTE_CUOTAS_LEDGER',
        objetivo: 'Cuenta',
        objetivoId: cuentaId,
        detalles: { cantidad, saldoAnte, saldoPost, nota }
      });

      return NextResponse.json({
        success: true,
        message: 'Movimiento de ajuste registrado y saldo actualizado.',
        movimiento,
        cuenta: modificada
      });
    }

    // 3. ELIMINAR SALDO (baja manual del saldo inactivo — SOLO superadmin, nunca automática)
    // Deja el saldo en 0 registrando un movimiento AJUSTE_MANUAL en el ledger, para que la
    // baja quede auditada y el ledger siga cuadrando con el saldo. Requiere nota obligatoria.
    if (validacion.data.accion === 'eliminar_saldo') {
      const nota = validacion.data.nota;
      if (!nota || nota.trim().length < 3) {
        return NextResponse.json({ error: 'La nota explicativa es obligatoria para eliminar el saldo.' }, { status: 400 });
      }

      const saldoAnte = cuenta.saldoFacturas;
      if (saldoAnte <= 0) {
        return NextResponse.json({ error: 'La cuenta no tiene saldo de facturas para eliminar.' }, { status: 400 });
      }
      const cantidad = -saldoAnte;
      const saldoPost = 0;

      const [movimiento, modificada] = await prisma.$transaction([
        prisma.movimientoCuota.create({
          data: {
            cuentaId,
            tipo: 'AJUSTE_MANUAL',
            cantidad,
            saldoAnte,
            saldoPost,
            nota: `[Superadmin Baja de saldo inactivo] ${nota}`
          }
        }),
        prisma.cuenta.update({
          where: { id: cuentaId },
          data: { saldoFacturas: saldoPost }
        })
      ]);

      await registrarLogAuditoria({
        adminId,
        accion: 'ELIMINAR_SALDO_INACTIVO',
        objetivo: 'Cuenta',
        objetivoId: cuentaId,
        detalles: { saldoEliminado: saldoAnte, nota }
      });

      return NextResponse.json({
        success: true,
        message: `Saldo de ${saldoAnte} factura(s) eliminado y registrado en el ledger.`,
        movimiento,
        cuenta: modificada
      });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error POST /api/admin/cuotas/[cuentaId]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error procesando acción sobre cuotas' }, { status: 500 });
  }
}
