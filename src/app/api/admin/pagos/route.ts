import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { z } from 'zod';

const AccionPagoSchema = z.object({
  pagoId: z.string().min(1, 'ID de pago requerido'),
  accion: z.enum(['reintentar', 'reembolsar']),
  nota: z.string().optional(),
  debitoCuotas: z.boolean().default(false)
});

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado');
    const cuentaId = searchParams.get('cuentaId');

    const where: any = {};
    if (estado && estado !== 'all') {
      where.estado = estado;
    }
    if (cuentaId) {
      where.cuentaId = cuentaId;
    }

    const resultado = await paginar(prisma.pagoCuenta, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cuenta: { select: { id: true, nombre: true, empresa: true, ruc: true, correo: true } },
        plan: { select: { id: true, name: true, nombre: true } }
      }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error GET /api/admin/pagos:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener pagos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = AccionPagoSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { pagoId, accion, nota, debitoCuotas } = validacion.data;

    const pago = await prisma.pagoCuenta.findUnique({
      where: { id: pagoId },
      include: { cuenta: true, plan: true }
    });

    if (!pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // 1. REINTENTAR COBRO (Para pagos FALLIDOS o PENDIENTES)
    if (accion === 'reintentar') {
      if (pago.estado === 'PAGADO') {
        return NextResponse.json({ error: 'El pago ya se encuentra cobrado/pagado' }, { status: 400 });
      }

      // Simulación de reintento con gateway o confirmación en local
      const nuevoEstado = 'PAGADO';
      const modificado = await prisma.pagoCuenta.update({
        where: { id: pagoId },
        data: { estado: nuevoEstado }
      });

      // Acreditar cuotas si el plan incluye facturas
      let cuotasAcreditadas = 0;
      if (pago.plan && (pago.plan.facturasIncluidas > 0 || pago.plan.includedDocuments > 0)) {
        cuotasAcreditadas = pago.plan.facturasIncluidas || pago.plan.includedDocuments || 0;
        await prisma.$transaction([
          prisma.movimientoCuota.create({
            data: {
              cuentaId: pago.cuentaId,
              tipo: 'CREDITO_COMPRA',
              cantidad: cuotasAcreditadas,
              saldoAnte: pago.cuenta.saldoFacturas,
              saldoPost: pago.cuenta.saldoFacturas + cuotasAcreditadas,
              nota: `Crédito por reintento exitoso de pago de plan ${pago.plan.nombre || pago.plan.name}`,
              referencia: pagoId
            }
          }),
          prisma.cuenta.update({
            where: { id: pago.cuentaId },
            data: { saldoFacturas: pago.cuenta.saldoFacturas + cuotasAcreditadas }
          })
        ]);
      }

      await registrarLogAuditoria({
        adminId,
        accion: 'REINTENTAR_COBRO',
        objetivo: 'PagoCuenta',
        objetivoId: pagoId,
        detalles: { monto: pago.monto, cuotasAcreditadas }
      });

      return NextResponse.json({
        success: true,
        message: `Cobro reintentado exitosamente. Estado: ${nuevoEstado}. Cuotas acreditadas: ${cuotasAcreditadas}`,
        pago: modificado
      });
    }

    // 2. REEMBOLSAR (Para pagos PAGADOS)
    if (accion === 'reembolsar') {
      if (pago.estado === 'REEMBOLSADO') {
        return NextResponse.json({ error: 'El pago ya había sido reembolsado previamente' }, { status: 400 });
      }

      const modificado = await prisma.pagoCuenta.update({
        where: { id: pagoId },
        data: { estado: 'REEMBOLSADO' }
      });

      let saldoActual = pago.cuenta.saldoFacturas;
      let movDebito = null;

      // Si se solicita o es aplicable el débito de cuotas asociadas al reembolso
      if (debitoCuotas && pago.plan) {
        const cuotasADebitar = pago.plan.facturasIncluidas || pago.plan.includedDocuments || 0;
        if (cuotasADebitar > 0) {
          const nuevoSaldo = Math.max(0, saldoActual - cuotasADebitar);
          const cantidadDebito = nuevoSaldo - saldoActual; // negativo

          const res = await prisma.$transaction([
            prisma.movimientoCuota.create({
              data: {
                cuentaId: pago.cuentaId,
                tipo: 'REEMBOLSO',
                cantidad: cantidadDebito,
                saldoAnte: saldoActual,
                saldoPost: nuevoSaldo,
                nota: `Debito por reembolso del pago ${pagoId}. ${nota || ''}`,
                referencia: pagoId
              }
            }),
            prisma.cuenta.update({
              where: { id: pago.cuentaId },
              data: { saldoFacturas: nuevoSaldo }
            })
          ]);
          movDebito = res[0];
          saldoActual = res[1].saldoFacturas;
        }
      }

      await registrarLogAuditoria({
        adminId,
        accion: 'REEMBOLSAR_PAGO',
        objetivo: 'PagoCuenta',
        objetivoId: pagoId,
        detalles: { monto: pago.monto, debitoCuotas, nota }
      });

      return NextResponse.json({
        success: true,
        message: 'Pago marcado como reembolsado correctamente.',
        pago: modificado,
        movimientoDebito: movDebito,
        nuevoSaldoCuenta: saldoActual
      });
    }

    return NextResponse.json({ error: 'Acción no permitida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error POST /api/admin/pagos:', error);
    return NextResponse.json({ error: error.message || 'Error en gestión de pagos' }, { status: 500 });
  }
}
