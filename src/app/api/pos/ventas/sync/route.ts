import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { emitirFacturaPAC } from '@/lib/pac/mock-pac-client';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, ventasQueue } = body; // ventas locales o IDs en cola

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID requerido para retransmisión al PAC' }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const cuenta = await prisma.cuenta.findFirst({ where: { ruc: empresa.ruc } });
    if (!cuenta) {
      return NextResponse.json({ error: 'No hay cuenta fiscal vinculada para consumo de cuotas' }, { status: 404 });
    }

    // Buscar ventas en estado LOCAL o EN_COLA (o si el frontend manda un array para re-insertar desde IndexedDB)
    let ventasParaSync = [];
    if (ventasQueue && Array.isArray(ventasQueue) && ventasQueue.length > 0) {
      // Si vienen de IndexedDB y aún no existían en postgres, crearlas
      for (const itemLocal of ventasQueue) {
        if (!itemLocal.id?.startsWith('sync-')) {
          const vDB = await prisma.venta.findFirst({ where: { id: itemLocal.id } });
          if (vDB && vDB.estado === 'AUTORIZADA') continue;
        }

        const v = await prisma.venta.upsert({
          where: { id: itemLocal.id || 'new-' + Math.random() },
          update: { estado: 'EN_COLA' },
          create: {
            empresaId,
            cuentaId: cuenta.id,
            tipoDoc: itemLocal.tipoDoc || '02',
            clienteRuc: itemLocal.clienteRuc || 'CF',
            items: itemLocal.items || [],
            subtotal: itemLocal.subtotal || 0,
            itbms: itemLocal.itbms || 0,
            total: itemLocal.total || 0,
            metodoPago: itemLocal.metodoPago || 'EFECTIVO',
            estado: 'EN_COLA',
            contingencia: true
          }
        });
        ventasParaSync.push(v);
      }
    } else {
      ventasParaSync = await prisma.venta.findMany({
        where: {
          empresaId,
          estado: { in: ['LOCAL', 'EN_COLA', 'RECHAZADA'] }
        },
        orderBy: { createdAt: 'asc' },
        take: 25 // Lote ordenado para respetar consecutivos
      });
    }

    if (ventasParaSync.length === 0) {
      return NextResponse.json({ success: true, message: 'La cola de sincronización está limpia. 0 ventas pendientes.' });
    }

    let autorizadas = 0;
    let fallidas = 0;
    const resultados = [];

    for (const v of ventasParaSync) {
      // Verificar saldo por cada iteración
      const cuentaActual = await prisma.cuenta.findUnique({ where: { id: cuenta.id } });
      if (!cuentaActual || cuentaActual.saldoFacturas <= 0) {
        resultados.push({ id: v.id, status: 'ERROR_SALDO_AGOTADO', message: 'Se detuvo la sincronización por saldo 0 de facturas.' });
        fallidas++;
        break;
      }

      const items: any = Array.isArray(v.items) ? v.items : [];
      const payloadFE = {
        empresaRuc: cuenta.ruc,
        sucursal: 'POS-SYNC-OFFLINE',
        tipoDocumento: (v.tipoDoc as '01' | '02') || '02',
        cliente: {
          ruc: v.clienteRuc || '999999999',
          razonSocial: `Contingencia POS - ${v.clienteRuc || 'CF'}`,
          direccion: 'Panamá'
        },
        items: items.map((i: any) => ({
          descripcion: i.descripcion || 'Producto POS',
          cantidad: i.cantidad || 1,
          precioUnitario: i.precioUnitario || 1,
          tasaItbms: i.itbmsPorcentaje === 7 ? '01' : '00'
        })),
        totales: {
          subtotal: Number(v.subtotal),
          itbms: Number(v.itbms),
          total: Number(v.total)
        }
      };

      const resPAC = await emitirFacturaPAC(payloadFE);

      if (resPAC.success && resPAC.cufe) {
        await prisma.venta.update({
          where: { id: v.id },
          data: {
            cufe: resPAC.cufe,
            estado: 'AUTORIZADA',
            contingencia: false
          }
        });

        await prisma.$transaction([
          prisma.cuenta.update({
            where: { id: cuenta.id },
            data: { saldoFacturas: { decrement: 1 } }
          }),
          prisma.movimientoCuota.create({
            data: {
              cuentaId: cuenta.id,
              tipo: 'DEBITO_EMISION',
              cantidad: -1,
              saldoAnte: cuentaActual.saldoFacturas,
              saldoPost: cuentaActual.saldoFacturas - 1,
              nota: `Sincronización Contingencia POS (72h) - CUFE: ${resPAC.cufe.substring(0, 15)}...`,
              referencia: `SYNC-${v.id}`
            }
          }),
          prisma.facturaEmitida.create({
            data: {
              cuentaId: cuenta.id,
              cufe: resPAC.cufe,
              cliente: v.clienteRuc || 'Consumidor Final POS Sync',
              total: v.total,
              itbms: v.itbms,
              estado: 'ACEPTADA'
            }
          })
        ]);

        autorizadas++;
        resultados.push({ id: v.id, status: 'AUTORIZADA', cufe: resPAC.cufe });
      } else {
        fallidas++;
        resultados.push({ id: v.id, status: 'ERROR_PAC' });
      }
    }

    await registrarLogAuditoria({
      adminId: empresaId,
      accion: 'RETRANSMISION_COLA_POS_DGI',
      objetivo: 'PosSyncLog',
      detalles: { totalCola: ventasParaSync.length, autorizadas, fallidas },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: `Retransmisión finalizada. Autorizadas: ${autorizadas}, Fallidas o en espera: ${fallidas}`,
      resultados
    });
  } catch (error: any) {
    console.error('Error POST /api/pos/ventas/sync:', error);
    return NextResponse.json({ error: 'Error durante la sincronización de cola offline con el PAC' }, { status: 500 });
  }
}
