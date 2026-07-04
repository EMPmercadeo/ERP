import { Prisma } from "@prisma/client";

interface LineaAsientoInput {
  codigoCuenta: string;
  debe?: number;
  haber?: number;
  descripcion?: string;
}

interface CrearAsientoInput {
  empresaId: string;
  fecha: Date;
  concepto: string;
  origen: string;
  origenId?: string;
  usuarioId: string;
  lineas: LineaAsientoInput[];
}

export async function crearAsientoContable(tx: Prisma.TransactionClient, input: CrearAsientoInput) {
  const cuentas = await tx.planCuentas.findMany({
    where: { empresaId: input.empresaId },
    select: { id: true, codigo: true },
  });
  const mapaCuentas = new Map(cuentas.map((c) => [c.codigo, c.id]));

  const lineasResueltas = input.lineas
    .filter((l) => (l.debe ?? 0) !== 0 || (l.haber ?? 0) !== 0)
    .map((l) => {
      const cuentaId = mapaCuentas.get(l.codigoCuenta);
      if (!cuentaId) {
        throw new Error(`Cuenta contable con código ${l.codigoCuenta} no existe para esta empresa.`);
      }
      return {
        cuentaId,
        debe: l.debe ?? 0,
        haber: l.haber ?? 0,
        descripcion: l.descripcion,
      };
    });

  const totalDebe = lineasResueltas.reduce((s, l) => s + l.debe, 0);
  const totalHaber = lineasResueltas.reduce((s, l) => s + l.haber, 0);

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    throw new Error(
      `Asiento contable descuadrado: Debe=${totalDebe.toFixed(2)} Haber=${totalHaber.toFixed(2)} (origen: ${input.origen})`
    );
  }

  const ultimo = await tx.asientoContable.aggregate({
    where: { empresaId: input.empresaId },
    _max: { numero: true },
  });
  const numero = (ultimo._max.numero ?? 0) + 1;

  return tx.asientoContable.create({
    data: {
      empresaId: input.empresaId,
      numero,
      fecha: input.fecha,
      concepto: input.concepto,
      origen: input.origen,
      origenId: input.origenId,
      totalDebe,
      totalHaber,
      estado: "CONFIRMADO",
      usuarioId: input.usuarioId,
      lineas: { create: lineasResueltas },
    },
  });
}

export async function generarAsientoFactura(
  tx: Prisma.TransactionClient,
  params: {
    empresaId: string;
    facturaId: string;
    numeroCompleto: string;
    fecha: Date;
    usuarioId: string;
    subtotal: number;
    totalDescuento: number;
    totalItbms: number;
    totalNeto: number;
    ventasMercancias: number;
    ventasServicios: number;
  }
) {
  const lineas: LineaAsientoInput[] = [
    { codigoCuenta: "1.1.02.01", debe: params.totalNeto, descripcion: `Factura ${params.numeroCompleto}` },
  ];

  if (params.totalDescuento > 0) {
    lineas.push({ codigoCuenta: "4.2", debe: params.totalDescuento, descripcion: `Descuento factura ${params.numeroCompleto}` });
  }
  if (params.ventasMercancias > 0) {
    lineas.push({ codigoCuenta: "4.1.01", haber: params.ventasMercancias, descripcion: `Factura ${params.numeroCompleto}` });
  }
  if (params.ventasServicios > 0) {
    lineas.push({ codigoCuenta: "4.1.02", haber: params.ventasServicios, descripcion: `Factura ${params.numeroCompleto}` });
  }
  if (params.totalItbms > 0) {
    lineas.push({ codigoCuenta: "2.1.02.01", haber: params.totalItbms, descripcion: `ITBMS factura ${params.numeroCompleto}` });
  }

  return crearAsientoContable(tx, {
    empresaId: params.empresaId,
    fecha: params.fecha,
    concepto: `Venta según factura ${params.numeroCompleto}`,
    origen: "FACTURA",
    origenId: params.facturaId,
    usuarioId: params.usuarioId,
    lineas,
  });
}

function mapearCuentaPorMetodoPago(metodoPago: string): string {
  const metodo = metodoPago.toLowerCase();
  if (metodo === "efectivo") {
    return "1.1.01.01"; // Caja General
  }
  // tarjeta, yappy, transferencia y cualquier otro método liquidan en cuenta bancaria
  return "1.1.01.02"; // Bancos - Cuenta Corriente
}

export async function generarAsientoCobro(
  tx: Prisma.TransactionClient,
  params: {
    empresaId: string;
    pagoId: string;
    numeroFactura: string;
    fecha: Date;
    usuarioId: string;
    monto: number;
    metodoPago: string;
  }
) {
  const cuentaOrigen = mapearCuentaPorMetodoPago(params.metodoPago);

  return crearAsientoContable(tx, {
    empresaId: params.empresaId,
    fecha: params.fecha,
    concepto: `Cobro factura ${params.numeroFactura} (${params.metodoPago})`,
    origen: "COBRO",
    origenId: params.pagoId,
    usuarioId: params.usuarioId,
    lineas: [
      { codigoCuenta: cuentaOrigen, debe: params.monto, descripcion: `Cobro factura ${params.numeroFactura}` },
      { codigoCuenta: "1.1.02.01", haber: params.monto, descripcion: `Cobro factura ${params.numeroFactura}` },
    ],
  });
}

