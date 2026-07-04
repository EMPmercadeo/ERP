export interface CuentaTemplate {
  codigo: string;
  nombre: string;
  tipo: "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESO" | "COSTO" | "GASTO";
  naturaleza: "DEUDORA" | "ACREEDORA";
  nivel: number;
  padre: string | null;
  aceptaMovimiento: boolean;
}

export const PLAN_CUENTAS_DEFAULT: CuentaTemplate[] = [
  { codigo: "1", nombre: "ACTIVO", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 1, padre: null, aceptaMovimiento: false },
  { codigo: "1.1", nombre: "ACTIVO CORRIENTE", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 2, padre: "1", aceptaMovimiento: false },
  { codigo: "1.1.01", nombre: "Efectivo y Equivalentes", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 3, padre: "1.1", aceptaMovimiento: false },
  { codigo: "1.1.01.01", nombre: "Caja General", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.1.01", aceptaMovimiento: true },
  { codigo: "1.1.01.02", nombre: "Bancos - Cuenta Corriente", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.1.01", aceptaMovimiento: true },
  { codigo: "1.1.01.03", nombre: "Bancos - Cuenta de Ahorro", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.1.01", aceptaMovimiento: true },
  { codigo: "1.1.02", nombre: "Cuentas por Cobrar", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 3, padre: "1.1", aceptaMovimiento: false },
  { codigo: "1.1.02.01", nombre: "Clientes Nacionales", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.1.02", aceptaMovimiento: true },
  { codigo: "1.1.02.02", nombre: "Estimación para Cuentas Incobrables", tipo: "ACTIVO", naturaleza: "ACREEDORA", nivel: 4, padre: "1.1.02", aceptaMovimiento: true },
  { codigo: "1.1.03", nombre: "Inventarios", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 3, padre: "1.1", aceptaMovimiento: false },
  { codigo: "1.1.03.01", nombre: "Inventario de Mercancías", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.1.03", aceptaMovimiento: true },
  { codigo: "1.1.04", nombre: "Impuestos Pagados por Anticipado", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 3, padre: "1.1", aceptaMovimiento: false },
  { codigo: "1.1.04.01", nombre: "ITBMS Crédito Fiscal", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.1.04", aceptaMovimiento: true },
  { codigo: "1.1.05", nombre: "Gastos Pagados por Anticipado", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 3, padre: "1.1", aceptaMovimiento: true },
  { codigo: "1.2", nombre: "ACTIVO NO CORRIENTE", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 2, padre: "1", aceptaMovimiento: false },
  { codigo: "1.2.01", nombre: "Propiedad, Planta y Equipo", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 3, padre: "1.2", aceptaMovimiento: false },
  { codigo: "1.2.01.01", nombre: "Mobiliario y Equipo de Oficina", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.2.01", aceptaMovimiento: true },
  { codigo: "1.2.01.02", nombre: "Equipo de Cómputo", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.2.01", aceptaMovimiento: true },
  { codigo: "1.2.01.03", nombre: "Vehículos", tipo: "ACTIVO", naturaleza: "DEUDORA", nivel: 4, padre: "1.2.01", aceptaMovimiento: true },
  { codigo: "1.2.01.04", nombre: "Depreciación Acumulada", tipo: "ACTIVO", naturaleza: "ACREEDORA", nivel: 4, padre: "1.2.01", aceptaMovimiento: true },
  { codigo: "2", nombre: "PASIVO", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 1, padre: null, aceptaMovimiento: false },
  { codigo: "2.1", nombre: "PASIVO CORRIENTE", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 2, padre: "2", aceptaMovimiento: false },
  { codigo: "2.1.01", nombre: "Cuentas por Pagar Proveedores", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 3, padre: "2.1", aceptaMovimiento: true },
  { codigo: "2.1.02", nombre: "Impuestos por Pagar", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 3, padre: "2.1", aceptaMovimiento: false },
  { codigo: "2.1.02.01", nombre: "ITBMS Débito Fiscal", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 4, padre: "2.1.02", aceptaMovimiento: true },
  { codigo: "2.1.02.02", nombre: "Retenciones de ITBMS por Pagar", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 4, padre: "2.1.02", aceptaMovimiento: true },
  { codigo: "2.1.02.03", nombre: "Impuesto Sobre la Renta por Pagar", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 4, padre: "2.1.02", aceptaMovimiento: true },
  { codigo: "2.1.03", nombre: "Gastos Acumulados por Pagar", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 3, padre: "2.1", aceptaMovimiento: false },
  { codigo: "2.1.03.01", nombre: "Sueldos y Salarios por Pagar", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 4, padre: "2.1.03", aceptaMovimiento: true },
  { codigo: "2.1.03.02", nombre: "Prestaciones Laborales por Pagar", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 4, padre: "2.1.03", aceptaMovimiento: true },
  { codigo: "2.1.04", nombre: "Anticipos de Clientes", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 3, padre: "2.1", aceptaMovimiento: true },
  { codigo: "2.2", nombre: "PASIVO NO CORRIENTE", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 2, padre: "2", aceptaMovimiento: false },
  { codigo: "2.2.01", nombre: "Préstamos Bancarios a Largo Plazo", tipo: "PASIVO", naturaleza: "ACREEDORA", nivel: 3, padre: "2.2", aceptaMovimiento: true },
  { codigo: "3", nombre: "PATRIMONIO", tipo: "PATRIMONIO", naturaleza: "ACREEDORA", nivel: 1, padre: null, aceptaMovimiento: false },
  { codigo: "3.1", nombre: "Capital Social", tipo: "PATRIMONIO", naturaleza: "ACREEDORA", nivel: 2, padre: "3", aceptaMovimiento: true },
  { codigo: "3.2", nombre: "Utilidades Retenidas", tipo: "PATRIMONIO", naturaleza: "ACREEDORA", nivel: 2, padre: "3", aceptaMovimiento: true },
  { codigo: "3.3", nombre: "Utilidad del Ejercicio", tipo: "PATRIMONIO", naturaleza: "ACREEDORA", nivel: 2, padre: "3", aceptaMovimiento: true },
  { codigo: "4", nombre: "INGRESOS", tipo: "INGRESO", naturaleza: "ACREEDORA", nivel: 1, padre: null, aceptaMovimiento: false },
  { codigo: "4.1", nombre: "Ventas", tipo: "INGRESO", naturaleza: "ACREEDORA", nivel: 2, padre: "4", aceptaMovimiento: false },
  { codigo: "4.1.01", nombre: "Ventas de Mercancías", tipo: "INGRESO", naturaleza: "ACREEDORA", nivel: 3, padre: "4.1", aceptaMovimiento: true },
  { codigo: "4.1.02", nombre: "Ventas de Servicios", tipo: "INGRESO", naturaleza: "ACREEDORA", nivel: 3, padre: "4.1", aceptaMovimiento: true },
  { codigo: "4.2", nombre: "Devoluciones y Descuentos en Ventas", tipo: "INGRESO", naturaleza: "DEUDORA", nivel: 2, padre: "4", aceptaMovimiento: true },
  { codigo: "4.3", nombre: "Otros Ingresos", tipo: "INGRESO", naturaleza: "ACREEDORA", nivel: 2, padre: "4", aceptaMovimiento: true },
  { codigo: "5", nombre: "COSTOS", tipo: "COSTO", naturaleza: "DEUDORA", nivel: 1, padre: null, aceptaMovimiento: false },
  { codigo: "5.1", nombre: "Costo de Ventas", tipo: "COSTO", naturaleza: "DEUDORA", nivel: 2, padre: "5", aceptaMovimiento: true },
  { codigo: "5.2", nombre: "Costo de Servicios", tipo: "COSTO", naturaleza: "DEUDORA", nivel: 2, padre: "5", aceptaMovimiento: true },
  { codigo: "6", nombre: "GASTOS", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 1, padre: null, aceptaMovimiento: false },
  { codigo: "6.1", nombre: "Gastos de Administración", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 2, padre: "6", aceptaMovimiento: false },
  { codigo: "6.1.01", nombre: "Sueldos y Salarios", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.1", aceptaMovimiento: true },
  { codigo: "6.1.02", nombre: "Alquiler", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.1", aceptaMovimiento: true },
  { codigo: "6.1.03", nombre: "Servicios Públicos", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.1", aceptaMovimiento: true },
  { codigo: "6.1.04", nombre: "Depreciación", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.1", aceptaMovimiento: true },
  { codigo: "6.1.05", nombre: "Papelería y Útiles", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.1", aceptaMovimiento: true },
  { codigo: "6.1.06", nombre: "Gastos de Representación", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.1", aceptaMovimiento: true },
  { codigo: "6.1.07", nombre: "Otros Gastos Administrativos", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.1", aceptaMovimiento: true },
  { codigo: "6.2", nombre: "Gastos de Ventas", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 2, padre: "6", aceptaMovimiento: false },
  { codigo: "6.2.01", nombre: "Comisiones sobre Ventas", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.2", aceptaMovimiento: true },
  { codigo: "6.2.02", nombre: "Publicidad y Mercadeo", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.2", aceptaMovimiento: true },
  { codigo: "6.2.03", nombre: "Fletes sobre Ventas", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.2", aceptaMovimiento: true },
  { codigo: "6.3", nombre: "Gastos Financieros", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 2, padre: "6", aceptaMovimiento: false },
  { codigo: "6.3.01", nombre: "Intereses Pagados", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.3", aceptaMovimiento: true },
  { codigo: "6.3.02", nombre: "Comisiones Bancarias", tipo: "GASTO", naturaleza: "DEUDORA", nivel: 3, padre: "6.3", aceptaMovimiento: true },
];

export async function crearPlanCuentasParaEmpresa(tx: any, empresaId: string) {
  const yaExiste = await tx.planCuentas.findFirst({ where: { empresaId } });
  if (yaExiste) return;

  const mapaCodigoAId = new Map<string, string>();
  const ordenados = [...PLAN_CUENTAS_DEFAULT].sort((a, b) => a.nivel - b.nivel);

  for (const cuenta of ordenados) {
    const cuentaPadreId = cuenta.padre ? mapaCodigoAId.get(cuenta.padre) ?? null : null;
    const creada = await tx.planCuentas.create({
      data: {
        empresaId,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
        nivel: cuenta.nivel,
        cuentaPadreId,
        aceptaMovimiento: cuenta.aceptaMovimiento,
        activa: true,
      },
    });
    mapaCodigoAId.set(cuenta.codigo, creada.id);
  }
}
