import { PrismaClient } from '@prisma/client';
import { 
  generarAsientoFactura, 
  generarAsientoCobro, 
  generarAsientoCompra, 
  generarAsientoPagoProveedor 
} from '../src/lib/contabilidad/asientos';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando reconstrucción de asientos contables históricos...');

  const empresa = await prisma.empresa.findFirst();
  if (!empresa) {
    console.log('❌ No hay empresas registradas.');
    return;
  }
  const empresaId = empresa.id;

  // 1. Reconstruir Asientos de Facturas
  console.log('\n🧾 Procesando Facturas...');
  const facturas = await prisma.factura.findMany({
    where: { empresaId },
    include: { items: { include: { producto: true } } }
  });

  let facturasProcesadas = 0;
  for (const factura of facturas) {
    const yaExiste = await prisma.asientoContable.findFirst({
      where: { origen: 'FACTURA', origenId: factura.id }
    });

    if (!yaExiste) {
      // Calcular ventas de mercancías vs servicios y totalDescuento de forma dinámica
      let ventasMercancias = 0;
      let ventasServicios = 0;
      let totalDescuento = 0;

      for (const item of factura.items) {
        const unidad = item.producto.unidadMedida;
        const montoBrutoItem = item.cantidad.toNumber() * item.precioUnitario.toNumber();
        totalDescuento += item.descuento.toNumber();
        if (unidad === 'SRV' || unidad === 'HRS') {
          ventasServicios += montoBrutoItem;
        } else {
          ventasMercancias += montoBrutoItem;
        }
      }

      await prisma.$transaction(async (tx) => {
        await generarAsientoFactura(tx, {
          empresaId,
          facturaId: factura.id,
          numeroCompleto: factura.numeroCompleto,
          fecha: factura.fechaEmision,
          usuarioId: factura.creadorId,
          subtotal: factura.subtotal.toNumber(),
          totalDescuento,
          totalItbms: factura.totalItbms.toNumber(),
          totalNeto: factura.totalNeto.toNumber(),
          ventasMercancias,
          ventasServicios,
        });
      });
      facturasProcesadas++;
    }
  }
  console.log(`✅ Facturas procesadas: ${facturasProcesadas} asientos creados.`);

  // 2. Reconstruir Asientos de Cobros (Pagos)
  console.log('\n💰 Procesando Cobros (Pagos)...');
  const pagos = await prisma.pago.findMany({
    where: { empresaId },
    include: { factura: true }
  });

  let pagosProcesados = 0;
  for (const pago of pagos) {
    const yaExiste = await prisma.asientoContable.findFirst({
      where: { origen: 'COBRO', origenId: pago.id }
    });

    if (!yaExiste) {
      await prisma.$transaction(async (tx) => {
        await generarAsientoCobro(tx, {
          empresaId,
          pagoId: pago.id,
          numeroFactura: pago.factura.numeroCompleto,
          fecha: pago.fechaPago,
          usuarioId: pago.usuarioId,
          monto: pago.monto.toNumber(),
          metodoPago: pago.metodoPago,
        });
      });
      pagosProcesados++;
    }
  }
  console.log(`✅ Cobros procesados: ${pagosProcesados} asientos creados.`);

  // 3. Reconstruir Asientos de Compras
  console.log('\n🚚 Procesando Compras...');
  const compras = await prisma.compra.findMany({
    where: { empresaId },
    include: { items: true }
  });

  let comprasProcesadas = 0;
  for (const compra of compras) {
    const yaExiste = await prisma.asientoContable.findFirst({
      where: { origen: 'COMPRA', origenId: compra.id }
    });

    if (!yaExiste) {
      let montoInventario = 0;
      let montoGastos = 0;

      for (const item of compra.items) {
        const baseImponible = item.montoTotal.toNumber() - item.montoItbms.toNumber();
        if (item.productoId) {
          montoInventario += baseImponible;
        } else {
          montoGastos += baseImponible;
        }
      }

      const totalNetoCalculado = montoInventario + montoGastos + compra.totalItbms.toNumber();

      await prisma.$transaction(async (tx) => {
        await generarAsientoCompra(tx, {
          empresaId,
          compraId: compra.id,
          numeroFactura: compra.numeroFactura,
          fecha: compra.fechaEmision,
          usuarioId: compra.creadorId,
          totalItbms: compra.totalItbms.toNumber(),
          totalNeto: totalNetoCalculado,
          montoInventario,
          montoGastos,
        });
      });
      comprasProcesadas++;
    }
  }
  console.log(`✅ Compras procesadas: ${comprasProcesadas} asientos creados.`);

  // 4. Reconstruir Asientos de Pagos a Proveedores
  console.log('\n💳 Procesando Pagos a Proveedores...');
  const pagosProveedores = await prisma.pagoProveedor.findMany({
    where: { empresaId },
    include: { compra: true }
  });

  let pagosProvProcesados = 0;
  for (const pagoProv of pagosProveedores) {
    const yaExiste = await prisma.asientoContable.findFirst({
      where: { origen: 'PAGO_PROVEEDOR', origenId: pagoProv.id }
    });

    if (!yaExiste) {
      await prisma.$transaction(async (tx) => {
        await generarAsientoPagoProveedor(tx, {
          empresaId,
          pagoProveedorId: pagoProv.id,
          numeroFactura: pagoProv.compra.numeroFactura,
          fecha: pagoProv.fechaPago,
          usuarioId: pagoProv.usuarioId,
          monto: pagoProv.monto.toNumber(),
          metodoPago: pagoProv.metodoPago,
        });
      });
      pagosProvProcesados++;
    }
  }
  console.log(`✅ Pagos a proveedores procesados: ${pagosProvProcesados} asientos creados.`);

  console.log('\n🎉 ¡Reconstrucción contable completada con éxito!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
