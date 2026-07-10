/**
 * Motor Matemático Puro de Planilla y RRHH - ERP Panamá (Ley 462 de 2025)
 * Creado e integrado para el sistema principal Next.js (erp-panama).
 */

export interface PeriodoCSSPatronal {
  hasta: string | null;
  tasa: number;
}

export interface ReglasPanamaConfig {
  css: {
    obrero: number;
    patronalPorPeriodo: PeriodoCSSPatronal[];
  };
  riesgosProfesionales: {
    default: number;
    rango: [number, number];
  };
  seguroEducativo: {
    obrero: number;
    patronal: number;
  };
  isr: {
    tramos: {
      desde: number;
      hasta: number | null;
      tasa: number;
      fijo: number;
    }[];
  };
  decimoTercerMes: {
    cssObrero: number;
    seguroEducativo: number;
    cssPatronal: number;
  };
  liquidacion: {
    vacaciones: number;
    primaAntiguedad: string;
  };
}

export const REGLAS_PANAMA: ReglasPanamaConfig = {
  css: {
    obrero: 0.0975,
    patronalPorPeriodo: [
      { hasta: "2027-02-28", tasa: 0.1325 },
      { hasta: "2029-02-28", tasa: 0.1425 },
      { hasta: null,          tasa: 0.1525 }
    ]
  },
  riesgosProfesionales: {
    default: 0.0105,
    rango: [0.0056, 0.0625]
  },
  seguroEducativo: {
    obrero: 0.0125,
    patronal: 0.0150
  },
  isr: {
    tramos: [
      { desde: 0,      hasta: 11000, tasa: 0.00, fijo: 0 },
      { desde: 11000,  hasta: 50000, tasa: 0.15, fijo: 0 },
      { desde: 50000,  hasta: null,  tasa: 0.25, fijo: 5850 }
    ]
  },
  decimoTercerMes: {
    cssObrero: 0.0725,
    seguroEducativo: 0.00,
    cssPatronal: 0.1075
  },
  liquidacion: {
    vacaciones: 1 / 11,
    primaAntiguedad: "1 semana de salario por año laborado (Ley 44)"
  }
};

export function redondear(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function obtenerTasaCSSPatronal(fechaCalculoStr: string = "2026-07-08"): number {
  const fecha = new Date(fechaCalculoStr);
  if (isNaN(fecha.getTime())) {
    return 0.1325;
  }
  for (const periodo of REGLAS_PANAMA.css.patronalPorPeriodo) {
    if (periodo.hasta === null) {
      return periodo.tasa;
    }
    const fechaLímite = new Date(periodo.hasta);
    if (fecha <= fechaLímite) {
      return periodo.tasa;
    }
  }
  return 0.1325;
}

export function calcularISR(salarioBrutoAnual: number, deduccionesAnuales: number): { baseGravable: number; isrAnual: number } {
  const rentaNetaGravable = Math.max(0, salarioBrutoAnual - deduccionesAnuales);
  let isrAnual = 0;

  for (const tramo of REGLAS_PANAMA.isr.tramos) {
    if (rentaNetaGravable > tramo.desde) {
      const tope = tramo.hasta === null ? rentaNetaGravable : Math.min(rentaNetaGravable, tramo.hasta);
      const baseExcedente = tope - tramo.desde;
      isrAnual += baseExcedente * tramo.tasa;
    }
  }

  return {
    baseGravable: redondear(rentaNetaGravable),
    isrAnual: redondear(isrAnual)
  };
}

export interface DeduccionesObreroResultado {
  salarioBruto: number;
  frecuenciaPago: string;
  cssObrero: number;
  seObrero: number;
  totalDeduccionCSSySE: number;
  baseGravableAnualProyectada: number;
  isrAnualProyectado: number;
  isrObrero: number;
  totalDeducciones: number;
  salarioNeto: number;
}

export function calcularDeduccionesObrero(salarioBrutoPeríodo: number, frecuenciaPago: string = "mensual"): DeduccionesObreroResultado {
  const bruto = Math.max(0, salarioBrutoPeríodo);
  let periodosPorAnio = 12;

  if (frecuenciaPago === "quincenal") periodosPorAnio = 24;
  else if (frecuenciaPago === "bisemanal") periodosPorAnio = 26;
  else if (frecuenciaPago === "semanal") periodosPorAnio = 52;
  else if (frecuenciaPago === "mensual") periodosPorAnio = 12;

  const cssObrero = redondear(bruto * REGLAS_PANAMA.css.obrero);
  const seObrero = redondear(bruto * REGLAS_PANAMA.seguroEducativo.obrero);
  const totalDeduccionCSSySE = redondear(cssObrero + seObrero);

  const brutoAnual = bruto * periodosPorAnio;
  const deduccionesAnuales = totalDeduccionCSSySE * periodosPorAnio;

  const infoISR = calcularISR(brutoAnual, deduccionesAnuales);
  const isrPeríodo = redondear(infoISR.isrAnual / periodosPorAnio);

  const totalDeducciones = redondear(totalDeduccionCSSySE + isrPeríodo);
  const salarioNeto = redondear(bruto - totalDeducciones);

  return {
    salarioBruto: redondear(bruto),
    frecuenciaPago,
    cssObrero,
    seObrero,
    totalDeduccionCSSySE,
    baseGravableAnualProyectada: infoISR.baseGravable,
    isrAnualProyectado: infoISR.isrAnual,
    isrObrero: isrPeríodo,
    totalDeducciones,
    salarioNeto
  };
}

export interface AportesPatronalesResultado {
  salarioBruto: number;
  fechaCalculo: string;
  tasaCSSPatronalAplicada: number;
  cssPatronal: number;
  sePatronal: number;
  tasaRiesgoAplicada: number;
  riesgosProfesionales: number;
  totalPatronal: number;
  costoTotalEmpresa: number;
}

export function calcularAportesPatronales(
  salarioBrutoPeríodo: number,
  fechaCalculoStr: string = "2026-07-08",
  tasaRiesgosProf: number = REGLAS_PANAMA.riesgosProfesionales.default
): AportesPatronalesResultado {
  const bruto = Math.max(0, salarioBrutoPeríodo);
  const tasaCSSPatronal = obtenerTasaCSSPatronal(fechaCalculoStr);

  const cssPatronal = redondear(bruto * tasaCSSPatronal);
  const sePatronal = redondear(bruto * REGLAS_PANAMA.seguroEducativo.patronal);
  const riesgosProfesionales = redondear(bruto * tasaRiesgosProf);

  const totalPatronal = redondear(cssPatronal + sePatronal + riesgosProfesionales);
  const costoTotalEmpresa = redondear(bruto + totalPatronal);

  return {
    salarioBruto: redondear(bruto),
    fechaCalculo: fechaCalculoStr,
    tasaCSSPatronalAplicada: tasaCSSPatronal,
    cssPatronal,
    sePatronal,
    tasaRiesgoAplicada: tasaRiesgosProf,
    riesgosProfesionales,
    totalPatronal,
    costoTotalEmpresa
  };
}

export interface XIIIMesResultado {
  montoDevengado4Meses: number;
  montoBruto: number;
  cssObrero: number;
  seObrero: number;
  isrObrero: number;
  totalDeduccionesObrero: number;
  montoNeto: number;
  cssPatronal: number;
  sePatronal: number;
  totalPatronal: number;
}

export function calcularXIIIMes(montoDevengadoCuatrimestre: number): XIIIMesResultado {
  const devengado = Math.max(0, montoDevengadoCuatrimestre);
  const bruto = redondear(devengado / 12);

  const cssObrero = redondear(bruto * REGLAS_PANAMA.decimoTercerMes.cssObrero);
  const seObrero = redondear(bruto * REGLAS_PANAMA.decimoTercerMes.seguroEducativo);
  const isrObrero = 0.00;

  const totalDeduccionesObrero = redondear(cssObrero + seObrero + isrObrero);
  const montoNeto = redondear(bruto - totalDeduccionesObrero);

  const cssPatronal = redondear(bruto * REGLAS_PANAMA.decimoTercerMes.cssPatronal);
  const sePatronal = 0.00;
  const totalPatronal = redondear(cssPatronal + sePatronal);

  return {
    montoDevengado4Meses: redondear(devengado),
    montoBruto: bruto,
    cssObrero,
    seObrero,
    isrObrero,
    totalDeduccionesObrero,
    montoNeto,
    cssPatronal,
    sePatronal,
    totalPatronal
  };
}

export interface LiquidacionResultado {
  salarioMensual: number;
  mesesLaborados: number;
  aniosLaborados: number;
  vacacionesProporcionales: number;
  decimoTercerMesProporcionalNeto: number;
  primaAntiguedad: number;
  totalDerechosAdquiridos: number;
  preavisoEstimado: number;
  indemnizacionEstimada: number;
  totalConDespidoInjustificado: number;
}

export function calcularLiquidacion(salarioMensualPromedio: number, mesesLaborados: number, aniosLaborados?: number): LiquidacionResultado {
  const sal = Math.max(0, salarioMensualPromedio);
  const meses = Math.max(0, mesesLaborados);
  const anios = aniosLaborados !== undefined ? Math.max(0, aniosLaborados) : meses / 12;

  const salarioSemanal = sal / (52 / 12);

  const devengadoTotalEnPeriodo = sal * meses;
  const vacacionesBrutas = devengadoTotalEnPeriodo * REGLAS_PANAMA.liquidacion.vacaciones;
  const vacacionesProporcionales = redondear(vacacionesBrutas);

  const mesesEnCuatrimestreActual = meses % 4;
  const devengadoEnCuatrimestreActual = sal * mesesEnCuatrimestreActual;
  const decimoCalc = calcularXIIIMes(devengadoEnCuatrimestreActual);
  const decimoTercerMesProporcionalNeto = decimoCalc.montoNeto;

  const primaAntiguedad = redondear(salarioSemanal * anios);
  const totalDerechosAdquiridos = redondear(vacacionesProporcionales + decimoTercerMesProporcionalNeto + primaAntiguedad);

  const preavisoEstimado = redondear(sal);

  let semanasIndemnizacion = 0;
  if (anios <= 10) {
    semanasIndemnizacion = anios * 3.4;
  } else {
    semanasIndemnizacion = (10 * 3.4) + ((anios - 10) * 1.0);
  }
  const indemnizacionEstimada = redondear(salarioSemanal * semanasIndemnizacion);
  const totalConDespidoInjustificado = redondear(totalDerechosAdquiridos + preavisoEstimado + indemnizacionEstimada);

  return {
    salarioMensual: redondear(sal),
    mesesLaborados: redondear(meses),
    aniosLaborados: redondear(anios),
    vacacionesProporcionales,
    decimoTercerMesProporcionalNeto,
    primaAntiguedad,
    totalDerechosAdquiridos,
    preavisoEstimado,
    indemnizacionEstimada,
    totalConDespidoInjustificado
  };
}
