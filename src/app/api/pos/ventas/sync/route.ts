import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { emitirFacturaPAC } from '@/lib/pac/mock-pac-client';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { obtenerTopeDescuentoSinAutorizacion } from '@/lib/services/discountAuth';

interface VentaItemJson {
  productoId?: string;
  descripcion?: string;
  cantidad?: number;
  precioUnitario?: number;
  itbmsPorcentaje?: number;
  descuentoPorcentaje?: number;
}

export async function POST(request: NextRequest) {
  try {
    // empresaId ya no se lee del body -- se deriva de la sesion, igual que en /api/pos/ventas.
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesion para sincronizar la cola del POS.' }, { status: 401 });
    }

    const body = await request.json();
    const { ventasQueue } = body; // ventas locales o IDs en cola

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
      // Si vienen de IndexedDB y aun no existian en postgres, crearlas
      for (const itemLocal of ventasQueue) {
        if (!itemLocal.id?.startsWith('sync-')) {
          const vDB = await prisma.venta.findFirst({ where: { id: itemLocal.id } });
          // Si la venta ya existe pero pertenece a otra empresa, la ignoramos por completo:
          // nunca se debe poder tocar (ni re-encolar) una venta ajena via este endpoint.
          if (vDB && vDB.empresaId !== empresaId) continue;
          if (vDB && vDB.estado === 'AUTORIZADA') continue;
        }

        const v = await prisma.venta.upsert({
          where: { id: itemLocal.id || 'new-' + Math.random() },
          update: { estado: 'EN_COLA', empresaId },
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
      return NextResponse.json({ success: true, message: 'La cola de sincronizacion esta limpia. 0 ventas pendientes.' });
    }

    let autorizadas = 0;
    let fallidas = 0;
    const resultados = [];

    // El lote offline llega con subtotal/itbms/total calculados en el navegador -- nunca se
    // confian tal cual (un cliente podria fabricar cualquier total). Se recalculan aqui a
    // partir de los items, y si algun item trae un descuento manual por encima de lo que el
    // vendedor puede aplicar sin autorizacion, se recorta automaticamente a ese tope: no hay
    // forma practica de pedir el PIN de un admin en medio de una retransmision en lote, asi
    // que en vez de confiar ciegamente en el descuento declarado, se limita al maximo seguro.
    const topeDescuento = await obtenerTopeDescuentoSinAutorizacion(empresaId, userId);

    for (const v of ventasParaSync) {
      // Verificar saldo por cada iteracion
      const cuentaActual = await prisma.cuenta.findUnique({ where: { id: cuenta.id } });
      if (!cuentaActual || cuentaActual.saldoFacturas <= 0) {
        resultados.push({ id: v.id, status: 'ERROR_SALDO_AGOTADO', message: 'Se detuvo la sincronizacion por saldo 0 de facturas.' });
        fallidas++;
        break;
      }

      const items: VentaItemJson[] = Array.isArray(v.items) ? (v.items as VentaItemJson[]) : [];
      let recorteAplicado = false;
      let subtotalReal = 0;
      let itbmsReal = 0;
      const itemsCorregidos = items.map((i: VentaItemJson) => {
        const descuentoSolicitado = Math.min(100, Math.max(0, Number(i.descuentoPorcentaje) || 0));
        const descuentoAplicado = descuentoSolicitado > topeDescuento ? topeDescuento : descuentoSolicitado;
        if (descuentoAplicado !== descuentoSolicitado) recorteAplicado = true;
        const bruto = (i.cantidad || 1) * (i.precioUnitario || 1);
        const neto = bruto - (bruto * (descuentoAplicado / 100));
        subtotalReal += neto;
        itbmsReal += neto * ((i.itbmsPorcentaje || 0) / 100);
        return { ...i, descuentoPorcentaje: descuentoAplicado };
      });
      const totalReal = subtotalReal + itbmsReal;

      // Corregir la venta guardada con los totales recalculados server-side.
      await prisma.venta.update({
        where: { id: v.id },
        data: {
          items: itemsCorregidos,
          subtotal: Number(subtotalReal.toFixed(2)),
          itbms: Number(itbmsReal.toFixed(2)),
          total: Number(totalReal.toFixed(2))
        }
      });

      const payloadFE = {
        empresaRuc: cuenta.ruc,
        sucursal: 'POS-SYNC-OFFLINE',
        tipoDocumento: (v.tipoDoc as '01' | '02') || '02',
        cliente: {
          ruc: v.clienteRuc || '999999999',
          razonSocial: `Contingencia POS - ${v.clienteRuc || 'CF'}`,
          direccion: 'Panama'
        },
        items: itemsCorregidos.map((i: VentaItemJson & { descuentoPorcentaje: number }) => ({
          descripcion: i.descripcion || 'Producto POS',
          cantidad: i.cantidad || 1,
          precioUnitario: Number(((i.precioUnitario || 1) * (1 - (i.descuentoPorcentaje || 0) / 100)).toFixed(4)),
          tasaItbms: i.itbmsPorcentaje === 7 ? '01' : '00'
        })),
        totales: {
          subtotal: Number(subtotalReal.toFixed(2)),
          itbms: Number(itbmsReal.toFixed(2)),
          total: Number(totalReal.toFixed(2))
        }
      };

      if (recorteAplicado) {
        resultados.push({ id: v.id, status: 'DESCUENTO_RECORTADO', message: `Un descuento superaba el ${topeDescuento}% permitido sin autorizacion y fue recortado a ese limite.` });
      }

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
              nota: `Sincronizacion Contingencia POS (72h) - CUFE: ${resPAC.cufe.substring(0, 15)}...`,
              referencia: `SYNC-${v.id}`
            }
          }),
          prisma.facturaEmitida.create({
            data: {
              cuentaId: cuenta.id,
              cufe: resPAC.cufe,
              cliente: v.clienteRuc || 'Consumidor Final POS Sync',
              total: Number(totalReal.toFixed(2)),
              itbms: Number(itbmsReal.toFixed(2)),
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
      adminId: userId,
      accion: 'RETRANSMISION_COLA_POS_DGI',
      objetivo: 'PosSyncLog',
      detalles: { totalCola: ventasParaSync.length, autorizadas, fallidas },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: `Retransmision finalizada. Autorizadas: ${autorizadas}, Fallidas o en espera: ${fallidas}`,
      resultados
    });
  } catch (error) {
    console.error('Error POST /api/pos/ventas/sync:', error);
    return NextResponse.json({ error: 'Error durante la sincronizacion de cola offline con el PAC' }, { status: 500 });
  }
}
