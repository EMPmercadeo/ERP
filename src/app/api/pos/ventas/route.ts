import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { emitirFacturaPAC } from '@/lib/pac/mock-pac-client';
import { getTenantContext } from '@/lib/auth/context';
import { verificarPinAutorizacion, obtenerTopeDescuentoSinAutorizacion } from '@/lib/services/discountAuth';
import { z } from 'zod';

const VentaSchema = z.object({
  cuentaId: z.string().optional(),
  tipoDoc: z.enum(['01', '02']),
  clienteRuc: z.string().optional(),
  items: z.array(z.object({
    productoId: z.string(),
    descripcion: z.string(),
    cantidad: z.number().positive(),
    precioUnitario: z.number().positive(),
    itbmsPorcentaje: z.number(),
    descuentoPorcentaje: z.number().min(0).max(100).optional().default(0)
  })).min(1, 'La venta debe contener al menos 1 item'),
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'YAPPY', 'TRANSFERENCIA', 'MIXTO']),
  offline: z.boolean().optional(),
  autorizacion: z.object({
    adminEmail: z.string().email(),
    pin: z.string().min(4).max(8)
  }).optional()
});

export async function GET(request: NextRequest) {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesion para ver las ventas del POS.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado');

    const where: Prisma.VentaWhereInput = { empresaId };
    if (estado && estado !== 'all') where.estado = estado;

    const resultado = await paginar(prisma.venta, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error GET /api/pos/ventas:', error);
    return NextResponse.json({ error: 'Error al listar ventas del POS' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesion para registrar ventas en el POS.' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = VentaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { cuentaId, tipoDoc, clienteRuc, items, metodoPago, offline, autorizacion } = parseResult.data;

    const maxDescuentoSolicitado = Math.max(0, ...items.map(it => it.descuentoPorcentaje || 0));
    let autorizadoPor: { id: string; nombre: string; rol: string } | null = null;

    if (maxDescuentoSolicitado > 0) {
      const tope = await obtenerTopeDescuentoSinAutorizacion(empresaId, userId);
      if (maxDescuentoSolicitado > tope) {
        if (!autorizacion) {
          return NextResponse.json({
            error: `Este descuento (${maxDescuentoSolicitado}%) supera tu limite permitido (${tope}%). Solicita a un administrador o gerente que lo autorice con su PIN.`,
            requiereAutorizacion: true,
            topePermitido: tope
          }, { status: 403 });
        }
        autorizadoPor = await verificarPinAutorizacion(empresaId, autorizacion.adminEmail, autorizacion.pin);
        if (!autorizadoPor) {
          return NextResponse.json({
            error: 'PIN de autorizacion invalido o la cuenta no tiene permiso para autorizar descuentos.',
            requiereAutorizacion: true,
            topePermitido: tope
          }, { status: 403 });
        }
      }
    }

    let subtotal = 0;
    let itbmsTotal = 0;
    let totalDescuento = 0;
    for (const item of items) {
      const impBruto = item.cantidad * item.precioUnitario;
      const montoDescuento = impBruto * ((item.descuentoPorcentaje || 0) / 100);
      const impLinea = impBruto - montoDescuento;
      const itbmsLinea = impLinea * (item.itbmsPorcentaje / 100);
      subtotal += impLinea;
      itbmsTotal += itbmsLinea;
      totalDescuento += montoDescuento;
    }
    const total = subtotal + itbmsTotal;

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    const cuenta = empresa ? await prisma.cuenta.findFirst({ where: { ruc: empresa.ruc } }) : null;
    if (cuentaId && cuenta && cuentaId !== cuenta.id) {
      return NextResponse.json({ error: 'La cuenta indicada no pertenece a tu empresa.' }, { status: 403 });
    }

    if (!offline && cuenta) {
      if (cuenta.saldoFacturas <= 0) {
        return NextResponse.json({
          error: 'Su saldo de facturas electronicas de la DGI ha llegado a 0. No es posible emitir en linea. Adquiera un paquete prepago o contacte a soporte para desbloquear.'
        }, { status: 403 });
      }
    }

    const venta = await prisma.venta.create({
      data: {
        empresaId,
        cuentaId: cuenta?.id || null,
        tipoDoc,
        clienteRuc: clienteRuc || (tipoDoc === '01' ? 'CF' : null),
        items: items as Prisma.InputJsonValue,
        subtotal: Number(subtotal.toFixed(2)),
        itbms: Number(itbmsTotal.toFixed(2)),
        total: Number(total.toFixed(2)),
        metodoPago,
        estado: offline ? 'LOCAL' : 'EN_COLA',
        contingencia: !!offline
      }
    });

    if (autorizadoPor) {
      await registrarLogAuditoria({
        adminId: autorizadoPor.id,
        accion: 'AUTORIZAR_DESCUENTO_POS',
        objetivo: 'Venta',
        objetivoId: venta.id,
        detalles: {
          vendedorId: userId,
          autorizadoPorNombre: autorizadoPor.nombre,
          autorizadoPorRol: autorizadoPor.rol,
          descuentoMaximoPorcentaje: maxDescuentoSolicitado,
          totalDescuento: Number(totalDescuento.toFixed(2))
        },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      });
    }

    if (offline || !cuenta) {
      for (const it of items) {
        try {
          await prisma.producto.updateMany({
            where: { id: it.productoId, unidadMedida: { not: 'SRV' } },
            data: { stockActual: { decrement: it.cantidad } }
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        venta,
        message: 'Venta guardada en modo Contingencia Local / Offline. Sera retransmitida automaticamente en cuanto se restablezca la conectividad (72h DGI).'
      });
    }

    const payloadFE = {
      empresaRuc: cuenta.ruc,
      sucursal: 'POS-MOVIL',
      tipoDocumento: tipoDoc as '01' | '02',
      cliente: {
        ruc: clienteRuc || '999999999',
        razonSocial: clienteRuc ? `Cliente RUC ${clienteRuc}` : 'Consumidor Final POS',
        direccion: 'Panama'
      },
      items: items.map(i => ({
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: Number((i.precioUnitario * (1 - (i.descuentoPorcentaje || 0) / 100)).toFixed(4)),
        tasaItbms: i.itbmsPorcentaje === 7 ? '01' : i.itbmsPorcentaje === 10 ? '02' : i.itbmsPorcentaje === 15 ? '03' : '00'
      })),
      totales: {
        subtotal: Number(subtotal.toFixed(2)),
        itbms: Number(itbmsTotal.toFixed(2)),
        total: Number(total.toFixed(2))
      }
    };

    const resPAC = await emitirFacturaPAC(payloadFE);

    if (resPAC.success && resPAC.cufe) {
      const ventaAutorizada = await prisma.venta.update({
        where: { id: venta.id },
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
            saldoAnte: cuenta.saldoFacturas,
            saldoPost: cuenta.saldoFacturas - 1,
            nota: `Emision electronica POS (${tipoDoc === '01' ? 'Factura' : 'Boleta'}) - CUFE: ${resPAC.cufe.substring(0, 15)}...`,
            referencia: `POS-${venta.id}`
          }
        }),
        prisma.facturaEmitida.create({
          data: {
            cuentaId: cuenta.id,
            cufe: resPAC.cufe,
            cliente: clienteRuc || (tipoDoc === '01' ? 'CF' : 'Consumidor Final POS'),
            total: venta.total,
            itbms: venta.itbms,
            estado: 'ACEPTADA'
          }
        })
      ]);

      for (const it of items) {
        try {
          await prisma.producto.updateMany({
            where: { id: it.productoId, unidadMedida: { not: 'SRV' } },
            data: { stockActual: { decrement: it.cantidad } }
          });
        } catch {}
      }

      await registrarLogAuditoria({
        adminId: userId,
        accion: 'EMISION_POS_ONLINE_AUTORIZADA',
        objetivo: 'Venta',
        objetivoId: venta.id,
        detalles: { cufe: resPAC.cufe, total: venta.total, metodoPago },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      });

      return NextResponse.json({
        success: true,
        venta: ventaAutorizada,
        cafUrl: resPAC.qrUrl,
        cufe: resPAC.cufe
      });
    } else {
      const ventaRechazada = await prisma.venta.update({
        where: { id: venta.id },
        data: { estado: 'RECHAZADA', contingencia: true }
      });

      return NextResponse.json({
        success: true,
        venta: ventaRechazada,
        warning: 'El PAC no respondio o rechazo en linea. La venta se almaceno en cola de reintento/contingencia sin consumir cuota aun.'
      });
    }
  } catch (error) {
    console.error('Error POST /api/pos/ventas:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al procesar la venta en el POS' }, { status: 500 });
  }
}
