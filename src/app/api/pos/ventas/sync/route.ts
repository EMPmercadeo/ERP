import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { emitirFacturaPAC } from '@/lib/pac/mock-pac-client';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';
import { obtenerTopeDescuentoSinAutorizacion } from '@/lib/services/discountAuth';
import { descontarStockVentaPos } from '@/lib/services/ventaPosStock';

interface VentaItemJson {
  productoId?: string;
  descripcion?: string;
  cantidad?: number;
  precioUnitario?: number;
  itbmsPorcentaje?: number;
  descuentoPorcentaje?: number;
}

interface VentaOfflineQueueItem {
  id?: string;
  tipoDoc?: string;
  clienteRuc?: string;
  items?: VentaItemJson[];
  subtotal?: number;
  itbms?: number;
  total?: number;
  metodoPago?: string;
  // Turno de caja bajo el cual se originó esta venta offline (capturado por el cliente desde
  // el turno activo antes de perder conectividad). Sin esto no queda ligada a ningún arqueo
  // de caja, así que se valida que pertenezca a la misma empresa antes de aceptarla.
  turnoCajaId?: string;
  // Referencia/autorización de Tarjeta/Yappy capturada por el cajero (flujo manual, sin
  // procesador de pagos real conectado).
  referenciaPago?: string;
}

export async function GET() {
  try {
    const { empresaId, role } = await getTenantContext();
    if (!['admin', 'super_admin', 'gerente', 'vendedor'].includes(role)) return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 });
    const pendientes = await prisma.venta.count({ where: { empresaId, estado: { in: ['LOCAL', 'EN_COLA', 'RECHAZADA'] } } });
    return NextResponse.json({ pendientes });
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar la cola PAC.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // empresaId ya no se lee del body -- se deriva de la sesion, igual que en /api/pos/ventas.
    let empresaId: string;
    let userId: string;
    let role: string;
    try {
      ({ empresaId, userId, role } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesion para sincronizar la cola del POS.' }, { status: 401 });
    }
    if (!['admin', 'super_admin', 'gerente', 'vendedor'].includes(role)) return NextResponse.json({ error: 'Sin permiso para sincronizar ventas del POS.' }, { status: 403 });

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
      for (const itemLocal of ventasQueue as VentaOfflineQueueItem[]) {
        const vDB = itemLocal.id ? await prisma.venta.findUnique({ where: { id: itemLocal.id } }) : null;
        // Nunca cambiar la empresa ni reencolar una venta finalizada o anulada.
        if (vDB && (vDB.empresaId !== empresaId || !['LOCAL', 'EN_COLA', 'RECHAZADA'].includes(vDB.estado))) continue;
        if (!vDB) {
          if (!itemLocal.id?.startsWith('sync-') || !['01', '02'].includes(itemLocal.tipoDoc ?? '') ||
              !['EFECTIVO', 'TARJETA', 'YAPPY', 'TRANSFERENCIA', 'MIXTO'].includes(itemLocal.metodoPago ?? '') ||
              !Array.isArray(itemLocal.items) || itemLocal.items.length === 0 || itemLocal.items.length > 50 ||
              new Set(itemLocal.items.map(i => i.productoId)).size !== itemLocal.items.length) {
            return NextResponse.json({ error: 'La cola contiene una venta inválida. Revisa los datos antes de sincronizar.' }, { status: 400 });
          }
          if (['TARJETA', 'YAPPY'].includes(itemLocal.metodoPago ?? '') && !itemLocal.referenciaPago?.trim()) {
            return NextResponse.json({ error: 'Falta la referencia de pago de una venta en la cola.' }, { status: 400 });
          }
          const productos = await prisma.producto.findMany({ where: { empresaId, id: { in: itemLocal.items.map(i => i.productoId!) } }, select: { id: true, descripcion: true, precioVenta: true, codigoTasaItbms: true } });
          if (productos.length !== itemLocal.items.length || itemLocal.items.some(i => {
            const p = productos.find(p => p.id === i.productoId);
            const tasa = p?.codigoTasaItbms === '01' ? 7 : p?.codigoTasaItbms === '02' ? 10 : p?.codigoTasaItbms === '03' ? 15 : 0;
            return !p || !Number.isFinite(i.cantidad) || (i.cantidad ?? 0) <= 0 ||
              !Number.isFinite(i.precioUnitario) || Math.abs((i.precioUnitario ?? 0) - Number(p.precioVenta)) > 0.0001 ||
              i.descripcion !== p.descripcion || i.itbmsPorcentaje !== tasa;
          })) {
            return NextResponse.json({ error: 'El precio o impuesto de una venta offline no coincide con el catálogo actual. Revísala antes de sincronizar.' }, { status: 409 });
          }
        }

        // El turno de caja declarado por el cliente solo se acepta si de verdad pertenece a
        // esta empresa; si no, la venta se retransmite igual (no se pierde una venta ya
        // cobrada por un problema de turno) pero queda sin ligar a ningún arqueo de caja.
        let turnoCajaId: string | null = null;
        if (itemLocal.turnoCajaId) {
          const turno = await prisma.turnoCaja.findFirst({
            where: { id: itemLocal.turnoCajaId, empresaId, usuarioId: userId }
          });
          if (turno) turnoCajaId = turno.id;
        }

        if (!vDB && !turnoCajaId) return NextResponse.json({ error: 'La venta offline no tiene un turno válido de este usuario.' }, { status: 409 });
        let v;
        if (vDB) {
          const actualizado = await prisma.venta.updateMany({ where: { id: vDB.id, empresaId, estado: { in: ['LOCAL', 'EN_COLA', 'RECHAZADA'] } }, data: { estado: 'EN_COLA' } });
          if (!actualizado.count) continue;
          v = await prisma.venta.findUniqueOrThrow({ where: { id: vDB.id } });
        } else {
          try {
            v = await prisma.venta.create({ data: {
              id: itemLocal.id!, empresaId, cuentaId: cuenta.id, turnoCajaId,
              tipoDoc: itemLocal.tipoDoc!, clienteRuc: itemLocal.clienteRuc || 'CF',
              items: itemLocal.items as unknown as Prisma.InputJsonValue,
              subtotal: itemLocal.subtotal || 0, itbms: itemLocal.itbms || 0,
              total: itemLocal.total || 0, metodoPago: itemLocal.metodoPago!,
              referenciaPago: itemLocal.referenciaPago || null, estado: 'EN_COLA', contingencia: true,
            } });
          } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') continue;
            throw error;
          }
          await descontarStockVentaPos(empresaId, v.id, itemLocal.items!.map(i => ({ productoId: i.productoId!, cantidad: i.cantidad! })));
        }
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
          items: itemsCorregidos as unknown as Prisma.InputJsonValue,
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
          tasaItbms: i.itbmsPorcentaje === 7 ? '01' : i.itbmsPorcentaje === 10 ? '02' : i.itbmsPorcentaje === 15 ? '03' : '00'
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
        const cufe = resPAC.cufe;
        await prisma.venta.update({
          where: { id: v.id },
          data: {
            cufe,
            estado: 'AUTORIZADA',
            contingencia: false
          }
        });

        await prisma.$transaction(async (tx) => {
          await tx.cuenta.update({
            where: { id: cuenta.id },
            data: { saldoFacturas: { decrement: 1 } }
          });
          // saldoAnte/saldoPost desde el saldo YA decrementado dentro de la transaccion,
          // no desde la lectura previa `cuentaActual` (que bajo sincronizaciones
          // concurrentes del mismo comercio dejaba el ledger inconsistente).
          const cuentaFresca = await tx.cuenta.findUnique({
            where: { id: cuenta.id },
            select: { saldoFacturas: true }
          });
          const saldoPost = cuentaFresca?.saldoFacturas ?? 0;
          const saldoAnte = saldoPost + 1;
          await tx.movimientoCuota.create({
            data: {
              cuentaId: cuenta.id,
              tipo: 'DEBITO_EMISION',
              cantidad: -1,
              saldoAnte,
              saldoPost,
              nota: `Sincronizacion Contingencia POS (72h) - CUFE: ${cufe.substring(0, 15)}...`,
              referencia: `SYNC-${v.id}`
            }
          });
          await tx.facturaEmitida.create({
            data: {
              cuentaId: cuenta.id,
              cufe,
              cliente: v.clienteRuc || 'Consumidor Final POS Sync',
              total: Number(totalReal.toFixed(2)),
              itbms: Number(itbmsReal.toFixed(2)),
              estado: 'ACEPTADA'
            }
          });
        });

        autorizadas++;
        resultados.push({ id: v.id, status: 'AUTORIZADA', cufe });
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
      autorizadas,
      fallidas,
      resultados
    });
  } catch (error) {
    console.error('Error POST /api/pos/ventas/sync:', error);
    return NextResponse.json({ error: 'Error durante la sincronizacion de cola offline con el PAC' }, { status: 500 });
  }
}
