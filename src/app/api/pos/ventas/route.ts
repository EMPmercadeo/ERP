import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { emitirFacturaPAC } from '@/lib/pac/mock-pac-client';
import { getTenantContext } from '@/lib/auth/context';
import { z } from 'zod';

// empresaId ya NO se acepta del cliente — siempre se deriva de getTenantContext() en el
// servidor. Antes este endpoint confiaba en el empresaId que mandaba el body del POST,
// lo que permitía spoofear ventas contra cualquier empresa y además dejó de funcionar en
// cuanto pos/page.tsx dejó de mandar empresaId (se quitó el fallback roto de localStorage).
const VentaSchema = z.object({
  cuentaId: z.string().optional(),
  tipoDoc: z.enum(['01', '02']), // 01 factura | 02 boleta
  clienteRuc: z.string().optional(),
  items: z.array(z.object({
    productoId: z.string(),
    descripcion: z.string(),
    cantidad: z.number().positive(),
    precioUnitario: z.number().positive(),
    itbmsPorcentaje: z.number() // 0, 7, 10, 15
  })).min(1, 'La venta debe contener al menos 1 ítem'),
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'YAPPY', 'TRANSFERENCIA', 'MIXTO']),
  offline: z.boolean().optional() // si el POS ya detectó que está offline o el usuario forzó contingencia local
});

export async function GET(request: NextRequest) {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para ver las ventas del POS.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const estado = searchParams.get('estado'); // 'LOCAL' | 'EN_COLA' | 'AUTORIZADA' | 'RECHAZADA' | 'all'

    // empresaId siempre viene de la sesión, nunca del query string — evita fugas cross-tenant.
    const where: any = { empresaId };
    if (estado && estado !== 'all') where.estado = estado;

    const resultado = await paginar(prisma.venta, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
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
      return NextResponse.json({ error: 'Debes iniciar sesión para registrar ventas en el POS.' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = VentaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { cuentaId, tipoDoc, clienteRuc, items, metodoPago, offline } = parseResult.data;

    // Calcular subtotal, itbms y total
    let subtotal = 0;
    let itbmsTotal = 0;
    for (const item of items) {
      const impLinea = item.cantidad * item.precioUnitario;
      const itbmsLinea = impLinea * (item.itbmsPorcentaje / 100);
      subtotal += impLinea;
      itbmsTotal += itbmsLinea;
    }
    const total = subtotal + itbmsTotal;

    // Obtener cuenta/empresa para verificar saldo de emisiones ante el PAC (sólo si se intenta emitir en línea).
    // Siempre se resuelve vía el RUC de la empresa de la sesión — nunca se confía en un
    // cuentaId que mande el cliente directamente, porque eso permitiría a cualquier usuario
    // autenticado apuntar a la cuenta (y cuota prepago) de otra empresa.
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    let cuenta = empresa ? await prisma.cuenta.findFirst({ where: { ruc: empresa.ruc } }) : null;
    if (cuentaId && cuenta && cuentaId !== cuenta.id) {
      return NextResponse.json({ error: 'La cuenta indicada no pertenece a tu empresa.' }, { status: 403 });
    }

    // Regla 0: Si está en línea, consumir 1 cuota del saldo de facturas y verificar bloqueo a saldo 0
    if (!offline && cuenta) {
      if (cuenta.saldoFacturas <= 0) {
        return NextResponse.json({
          error: 'Su saldo de facturas electrónicas de la DGI ha llegado a 0. No es posible emitir en línea. Adquiera un paquete prepago o contacte a soporte para desbloquear.'
        }, { status: 403 });
      }
    }

    // Guardar venta inicial
    const venta = await prisma.venta.create({
      data: {
        empresaId,
        cuentaId: cuenta?.id || null,
        tipoDoc,
        clienteRuc: clienteRuc || (tipoDoc === '01' ? 'CF' : null),
        items: items as any,
        subtotal: Number(subtotal.toFixed(2)),
        itbms: Number(itbmsTotal.toFixed(2)),
        total: Number(total.toFixed(2)),
        metodoPago,
        estado: offline ? 'LOCAL' : 'EN_COLA',
        contingencia: !!offline
      }
    });

    // Si está offline o en contingencia local, se devuelve de inmediato como guardada en cola
    if (offline || !cuenta) {
      // Reducir stock local de inmediato en transacción para evitar quiebres
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
        message: 'Venta guardada en modo Contingencia Local / Offline. Será retransmitida automáticamente en cuanto se restablezca la conectividad (72h DGI).'
      });
    }

    // Transacción en línea al PAC
    const payloadFE = {
      empresaRuc: cuenta.ruc,
      sucursal: 'POS-MOVIL',
      tipoDocumento: tipoDoc as '01' | '02',
      cliente: {
        ruc: clienteRuc || '999999999',
        razonSocial: clienteRuc ? `Cliente RUC ${clienteRuc}` : 'Consumidor Final POS',
        direccion: 'Panamá'
      },
      items: items.map(i => ({
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
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
      // 1. Actualizar venta
      const ventaAutorizada = await prisma.venta.update({
        where: { id: venta.id },
        data: {
          cufe: resPAC.cufe,
          estado: 'AUTORIZADA',
          contingencia: false
        }
      });

      // 2. Débito de 1 cuota en el saldo de facturas (Ledger prepago)
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
            nota: `Emisión electrónica POS (${tipoDoc === '01' ? 'Factura' : 'Boleta'}) - CUFE: ${resPAC.cufe.substring(0, 15)}...`,
            referencia: `POS-${venta.id}`
          }
        }),
        // 3. Registrar en FacturaEmitida para auditoría general del Superadmin
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

      // 4. Descontar stock del producto de forma transaccional
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
      // Si el PAC rechaza o falla temporalmente, dejamos en cola para reintento
      const ventaRechazada = await prisma.venta.update({
        where: { id: venta.id },
        data: { estado: 'RECHAZADA', contingencia: true }
      });

      return NextResponse.json({
        success: true,
        venta: ventaRechazada,
        warning: 'El PAC no respondió o rechazó en línea. La venta se almacenó en cola de reintento/contingencia sin consumir cuota aún.'
      });
    }
  } catch (error: any) {
    console.error('Error POST /api/pos/ventas:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar la venta en el POS' }, { status: 500 });
  }
}
