'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  calcularDeduccionesObrero,
  calcularAportesPatronales,
  calcularXIIIMes,
  calcularLiquidacion,
  calcularAntiguedadMeses,
  calcularMontoDevengadoPartidaXIII
} from '@/lib/payroll/panama-rules';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Calculator,
  Users,
  Gift,
  Scale,
  HelpCircle,
  ShieldAlert,
  Search,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';

function formatMoney(num: number): string {
  return `$${Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Colaborador real, tal como lo devuelve /api/rrhh/empleados (scoping por empresa vía
// getTenantContext() en el servidor). Antes esta pantalla usaba una lista de 5 colaboradores
// inventados que no tenían relación con el directorio real de RRHH.
interface ColaboradorReal {
  id: string;
  nombre: string;
  cedula: string;
  cargo: string;
  departamento: string;
  salarioBase: number | string;
  tipoContrato: string;
  fechaIngreso: string;
  frecuenciaPago: string;
  tasaRiesgo: number;
  activo: boolean;
}

export function PayrollClient() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculadora' | 'colaboradores' | 'decimo' | 'liquidaciones'>('dashboard');

  // Colaboradores reales cargados desde RRHH
  const [colaboradores, setColaboradores] = useState<ColaboradorReal[]>([]);
  const [cargandoColaboradores, setCargandoColaboradores] = useState(true);
  const [errorColaboradores, setErrorColaboradores] = useState('');

  const cargarColaboradores = useCallback(async () => {
    setCargandoColaboradores(true);
    setErrorColaboradores('');
    try {
      const res = await fetch('/api/rrhh/empleados?estado=activo&take=100');
      if (res.ok) {
        const data = await res.json();
        setColaboradores(data.items || []);
      } else {
        setErrorColaboradores('No se pudo cargar el directorio de colaboradores.');
      }
    } catch {
      setErrorColaboradores('Error de conexión al cargar colaboradores.');
    } finally {
      setCargandoColaboradores(false);
    }
  }, []);

  useEffect(() => {
    cargarColaboradores();
  }, [cargarColaboradores]);

  // Parámetros Calculadora en Tiempo Real
  const [calcSalario, setCalcSalario] = useState<number>(1200);
  const [calcFrecuencia, setCalcFrecuencia] = useState<string>('mensual');
  const [calcRiesgo, setCalcRiesgo] = useState<number>(0.0105);
  const [calcFecha, setCalcFecha] = useState<string>('2026-07-08');

  // Parámetros XIII Mes
  const [decAcumulado, setDecAcumulado] = useState<number>(4800);

  // Parámetros Liquidación
  const [liqSalario, setLiqSalario] = useState<number>(1200);
  const [liqMeses, setLiqMeses] = useState<number>(36);
  const [liqAnios, setLiqAnios] = useState<number>(3);

  // Filtro Colaboradores
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Cálculos reactivos Calculadora
  const dedObrero = useMemo(() => calcularDeduccionesObrero(calcSalario, calcFrecuencia), [calcSalario, calcFrecuencia]);
  const aportesPatronal = useMemo(() => calcularAportesPatronales(calcSalario, calcFecha, calcRiesgo), [calcSalario, calcFecha, calcRiesgo]);

  // Cálculos reactivos XIII Mes
  const decCalc = useMemo(() => calcularXIIIMes(decAcumulado), [decAcumulado]);

  // Cálculos reactivos Liquidación
  const liqCalc = useMemo(() => calcularLiquidacion(liqSalario, liqMeses, liqAnios), [liqSalario, liqMeses, liqAnios]);

  // Consolidado para el Dashboard — sobre colaboradores reales y activos
  const dashMetrics = useMemo(() => {
    let totalBruto = 0;
    let totalRetenciones = 0;
    let totalPatronal = 0;

    colaboradores.forEach(c => {
      const salario = Number(c.salarioBase) || 0;
      totalBruto += salario;
      const d = calcularDeduccionesObrero(salario, 'mensual');
      totalRetenciones += d.totalDeducciones;
      const p = calcularAportesPatronales(salario, calcFecha, c.tasaRiesgo);
      totalPatronal += p.totalPatronal;
    });

    const costoTotal = totalBruto + totalPatronal;
    const netoTotal = totalBruto - totalRetenciones;

    return { totalBruto, totalRetenciones, totalPatronal, costoTotal, netoTotal };
  }, [colaboradores, calcFecha]);

  const colaboradoresFiltrados = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return colaboradores;
    return colaboradores.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.cargo.toLowerCase().includes(q) ||
      c.departamento.toLowerCase().includes(q) ||
      c.cedula.toLowerCase().includes(q)
    );
  }, [colaboradores, filterQuery]);

  // Colaborador "consultado" — cuando se selecciona uno (desde el directorio o desde el
  // selector de las pestañas de cálculo), se usan sus datos reales (salario, frecuencia,
  // tasa de riesgo y sobre todo su fecha de ingreso real) para alimentar automáticamente
  // la Calculadora, el XIII Mes y la Liquidación, en vez de que el usuario tenga que
  // teclear manualmente meses/años laborados o el monto devengado del cuatrimestre.
  const [colaboradorActivoId, setColaboradorActivoId] = useState<string>('');

  const colaboradorActivo = useMemo(
    () => colaboradores.find(c => c.id === colaboradorActivoId) || null,
    [colaboradores, colaboradorActivoId]
  );

  const antiguedadMesesActivo = useMemo(
    () => (colaboradorActivo ? calcularAntiguedadMeses(colaboradorActivo.fechaIngreso) : 0),
    [colaboradorActivo]
  );

  const aplicarColaborador = useCallback((col: ColaboradorReal) => {
    const salario = Number(col.salarioBase) || 0;
    const meses = calcularAntiguedadMeses(col.fechaIngreso);

    setColaboradorActivoId(col.id);

    // Calculadora en tiempo real
    setCalcSalario(salario);
    setCalcFrecuencia(col.frecuenciaPago);
    setCalcRiesgo(col.tasaRiesgo);

    // XIII Mes: monto realmente devengado en el cuatrimestre legal vigente
    setDecAcumulado(calcularMontoDevengadoPartidaXIII(salario, col.fechaIngreso));

    // Liquidación: antigüedad real desde su fecha de ingreso
    setLiqSalario(salario);
    setLiqMeses(meses);
    setLiqAnios(parseFloat((meses / 12).toFixed(2)));
  }, []);

  const simularColaborador = (col: ColaboradorReal) => {
    aplicarColaborador(col);
    setActiveTab('calculadora');
  };

  const limpiarColaboradorActivo = () => setColaboradorActivoId('');

  const hayColaboradores = colaboradores.length > 0;

  return (
    <div className="space-y-6">
      {/* Navegación por pestañas ejecutivas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'outline'}
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 font-medium"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'calculadora' ? 'default' : 'outline'}
          onClick={() => setActiveTab('calculadora')}
          className="flex items-center gap-2 font-medium"
        >
          <Calculator className="h-4 w-4" />
          Calculadora en Tiempo Real
        </Button>
        <Button
          variant={activeTab === 'colaboradores' ? 'default' : 'outline'}
          onClick={() => setActiveTab('colaboradores')}
          className="flex items-center gap-2 font-medium"
        >
          <Users className="h-4 w-4" />
          Colaboradores
        </Button>
        <Button
          variant={activeTab === 'decimo' ? 'default' : 'outline'}
          onClick={() => setActiveTab('decimo')}
          className="flex items-center gap-2 font-medium"
        >
          <Gift className="h-4 w-4" />
          XIII Mes
        </Button>
        <Button
          variant={activeTab === 'liquidaciones' ? 'default' : 'outline'}
          onClick={() => setActiveTab('liquidaciones')}
          className="flex items-center gap-2 font-medium"
        >
          <Scale className="h-4 w-4" />
          Liquidaciones
        </Button>
      </div>

      {/* Selector de colaborador real — consulta sus datos y calcula usando su antigüedad
          real (fecha de ingreso), visible en las 3 pestañas de cálculo individual. */}
      {(activeTab === 'calculadora' || activeTab === 'decimo' || activeTab === 'liquidaciones') && hayColaboradores && (
        <Card className="border-brand-1/30 bg-brand-1/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="h-4 w-4 text-brand-1 shrink-0" />
              <label className="text-xs font-semibold text-foreground shrink-0">Consultar Colaborador:</label>
              <select
                value={colaboradorActivoId}
                onChange={e => {
                  const col = colaboradores.find(c => c.id === e.target.value);
                  if (col) aplicarColaborador(col);
                  else limpiarColaboradorActivo();
                }}
                className="flex-1 min-w-0 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Modo manual (sin colaborador) —</option>
                {colaboradores.map(col => (
                  <option key={col.id} value={col.id}>{col.nombre} — {col.cargo}</option>
                ))}
              </select>
            </div>
            {colaboradorActivo && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Antigüedad: {Math.floor(antiguedadMesesActivo / 12)}a {antiguedadMesesActivo % 12}m
                </Badge>
                <Button size="sm" variant="ghost" onClick={limpiarColaboradorActivo} className="text-xs h-8">
                  Limpiar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* VISTA 1: DASHBOARD DE NÓMINA */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Resumen Ejecutivo de Nómina (2026)</h2>
            <p className="text-sm text-muted-foreground">
              Métricas consolidadas de costos obrero-patronales bajo la Ley 462 de 2025, calculadas sobre tus colaboradores activos reales.
            </p>
          </div>

          {!cargandoColaboradores && !hayColaboradores ? (
            <Card className="border-dashed border-2 text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Aún no tienes colaboradores registrados</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Registra tu personal en el directorio de Colaboradores para que estas métricas de planilla se calculen automáticamente.
                </p>
                <Link href="/rrhh/empleados">
                  <Button className="bg-brand-1 hover:bg-brand-2 text-white font-bold">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ir a Colaboradores
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-cyan-500 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Total Nómina Bruta (Mensual)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{formatMoney(dashMetrics.totalBruto)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{colaboradores.length} colaborador{colaboradores.length === 1 ? '' : 'es'} activo{colaboradores.length === 1 ? '' : 's'}</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Cargas Patronales (CSS+SE+RP)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{formatMoney(dashMetrics.totalPatronal)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Tasa CSS Patronal vigente: 13.25%</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Retenciones DGI / CSS Obrero</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{formatMoney(dashMetrics.totalRetenciones)}</div>
                    <p className="text-xs text-muted-foreground mt-1">CSS (9.75%) + SE (1.25%) + ISR Progresivo</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Costo Total Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(dashMetrics.costoTotal)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Bruto + Total Cargas Patronales</p>
                  </CardContent>
                </Card>
              </div>

              {dashMetrics.costoTotal > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribución del Presupuesto de Nómina vs. Salario Neto</CardTitle>
                    <CardDescription>Proporciones relativas entre sueldo recibido y aportes de seguridad social.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex h-10 w-full rounded-lg overflow-hidden bg-muted font-bold text-xs">
                      <div
                        style={{ width: `${Math.round((dashMetrics.netoTotal / dashMetrics.costoTotal) * 100)}%` }}
                        className="bg-emerald-500 text-black flex items-center justify-center px-2 transition-all"
                      >
                        Neto ({Math.round((dashMetrics.netoTotal / dashMetrics.costoTotal) * 100)}%)
                      </div>
                      <div
                        style={{ width: `${Math.round((dashMetrics.totalRetenciones / dashMetrics.costoTotal) * 100)}%` }}
                        className="bg-cyan-500 text-black flex items-center justify-center px-2 transition-all"
                      >
                        Obrero ({Math.round((dashMetrics.totalRetenciones / dashMetrics.costoTotal) * 100)}%)
                      </div>
                      <div
                        style={{ width: `${Math.max(1, 100 - Math.round((dashMetrics.netoTotal / dashMetrics.costoTotal) * 100) - Math.round((dashMetrics.totalRetenciones / dashMetrics.costoTotal) * 100))}%` }}
                        className="bg-amber-500 text-black flex items-center justify-center px-2 transition-all"
                      >
                        Patronal ({Math.max(1, 100 - Math.round((dashMetrics.netoTotal / dashMetrics.costoTotal) * 100) - Math.round((dashMetrics.totalRetenciones / dashMetrics.costoTotal) * 100))}%)
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Salario Neto Recibido</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-500"></span> Retenciones Obreras (CSS + SE + ISR)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Cargas Patronales (CSS + SE + RP)</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="bg-cyan-500/10 border-l-4 border-cyan-500 p-4 rounded-r-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="font-semibold text-foreground">Cumplimiento Legal y Reforma CSS (Ley 462 de 2025):</strong> El motor de cálculo detecta la fecha del periodo de nómina. Para el tramo actual (hasta febrero de 2027), se aplica exactamente la cuota del <strong>13.25%</strong> en Seguro Social Patronal.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VISTA 2: CALCULADORA EN TIEMPO REAL */}
      {activeTab === 'calculadora' && (
        <TooltipProvider>
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">🧮 Calculadora de Planilla Panamá en Tiempo Real</h2>
              <p className="text-sm text-muted-foreground">
                Simulación instantánea con desglose centesimal de cuotas obreras, retenciones progresivas de ISR y aportes del empleador.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parámetros de Simulación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center justify-between">
                      <span>Salario Bruto ($)</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Monto nominal bruto del colaborador antes de deducciones</TooltipContent>
                      </Tooltip>
                    </label>
                    <Input
                      type="number"
                      value={calcSalario}
                      onChange={e => setCalcSalario(Math.max(0, parseFloat(e.target.value) || 0))}
                      step="50"
                      min="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center justify-between">
                      <span>Frecuencia de Pago</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Determina el divisor del ISR progresivo anualizado</TooltipContent>
                      </Tooltip>
                    </label>
                    <select
                      value={calcFrecuencia}
                      onChange={e => setCalcFrecuencia(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="mensual">Mensual (12 pagos/año)</option>
                      <option value="quincenal">Quincenal (24 pagos/año)</option>
                      <option value="bisemanal">Bisemanal (26 pagos/año)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center justify-between">
                      <span>Riesgos Profesionales (%)</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Tasa variable según actividad económica CIIU (0.56% a 6.25%)</TooltipContent>
                      </Tooltip>
                    </label>
                    <select
                      value={calcRiesgo}
                      onChange={e => setCalcRiesgo(parseFloat(e.target.value) || 0.0105)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="0.0105">1.05% - Oficina / Bajo Riesgo</option>
                      <option value="0.0210">2.10% - Almacén / Comercial</option>
                      <option value="0.0350">3.50% - Operaciones / Industrial</option>
                      <option value="0.0560">5.60% - Construcción / Alto Riesgo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center justify-between">
                      <span>Fecha de Planilla</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Determina el tramo escalonado de CSS Patronal (Ley 462)</TooltipContent>
                      </Tooltip>
                    </label>
                    <Input
                      type="date"
                      value={calcFecha}
                      onChange={e => setCalcFecha(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Desglose Obrero */}
              <Card className="border-t-4 border-t-cyan-500">
                <CardHeader>
                  <CardTitle className="text-lg text-cyan-600 dark:text-cyan-400">👤 Deducciones del Trabajador (Obrero)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Salario Bruto del Período:</span>
                    <strong className="font-semibold">{formatMoney(dedObrero.salarioBruto)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      Seguro Social (CSS 9.75%)
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Tasa fija del colaborador según Art. 114 Ley 51/462</TooltipContent></Tooltip>
                    </span>
                    <span className="text-red-500 font-medium">-{formatMoney(dedObrero.cssObrero)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      Seguro Educativo (SE 1.25%)
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Aporte fijo obligatorio del trabajador</TooltipContent></Tooltip>
                    </span>
                    <span className="text-red-500 font-medium">-{formatMoney(dedObrero.seObrero)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50 bg-muted/40 px-2 rounded">
                    <span className="font-medium">Total Deducción CSS + SE:</span>
                    <strong className="font-bold">{formatMoney(dedObrero.totalDeduccionCSSySE)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      Retención ISR Progresivo
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Exento hasta $11,000 netos anuales. Tramos 15% y 25% prorrateados</TooltipContent></Tooltip>
                    </span>
                    <span className="text-amber-500 font-medium">{formatMoney(dedObrero.isrObrero)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t-2 border-border text-base font-bold">
                    <span>SALARIO NETO A PAGAR:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-xl">{formatMoney(dedObrero.salarioNeto)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    💡 Base gravable anual proyectada para cálculo de ISR: <span className="font-semibold text-foreground">{formatMoney(dedObrero.baseGravableAnualProyectada)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Desglose Patronal */}
              <Card className="border-t-4 border-t-amber-500">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-600 dark:text-amber-400">🏢 Cargas del Empleador (Patronal)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Salario Bruto Base:</span>
                    <strong className="font-semibold">{formatMoney(aportesPatronal.salarioBruto)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      Seguro Social Patronal ({(aportesPatronal.tasaCSSPatronalAplicada * 100).toFixed(2)}%)
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Escalonado Ley 462: 13.25% vigente hasta feb-2027</TooltipContent></Tooltip>
                    </span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">{formatMoney(aportesPatronal.cssPatronal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      Seguro Educativo Patronal (1.50%)
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Aporte obligatorio de la empresa</TooltipContent></Tooltip>
                    </span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">{formatMoney(aportesPatronal.sePatronal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      Riesgos Profesionales ({(aportesPatronal.tasaRiesgoAplicada * 100).toFixed(2)}%)
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>Según clasificación de riesgo en tabla CIIU</TooltipContent></Tooltip>
                    </span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">{formatMoney(aportesPatronal.riesgosProfesionales)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50 bg-muted/40 px-2 rounded">
                    <span className="font-medium">Total Cargas Patronales:</span>
                    <strong className="font-bold text-amber-600 dark:text-amber-400">{formatMoney(aportesPatronal.totalPatronal)}</strong>
                  </div>
                  <div className="flex justify-between pt-3 border-t-2 border-border text-base font-bold">
                    <span>COSTO TOTAL EMPRESA:</span>
                    <span className="text-foreground text-xl">{formatMoney(aportesPatronal.costoTotalEmpresa)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    💡 Factor de carga prestacional directa: <span className="font-semibold text-foreground">{((aportesPatronal.totalPatronal / (aportesPatronal.salarioBruto || 1)) * 100).toFixed(2)}%</span> sobre el salario bruto.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TooltipProvider>
      )}

      {/* VISTA 3: DIRECTORIO DE COLABORADORES */}
      {activeTab === 'colaboradores' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">👥 Directorio de Colaboradores Activos</h2>
              <p className="text-sm text-muted-foreground">
                Consulta salarios base y posiciones fiscales en todos los tramos del sistema.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, cédula o cargo..."
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {cargandoColaboradores ? (
            <div className="text-center py-16 text-muted-foreground animate-pulse text-sm">Cargando colaboradores...</div>
          ) : errorColaboradores ? (
            <Card className="border-red-200 bg-red-50 text-center py-8">
              <CardContent className="text-sm text-red-600">{errorColaboradores}</CardContent>
            </Card>
          ) : !hayColaboradores ? (
            <Card className="border-dashed border-2 text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Aún no tienes colaboradores registrados</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Registra tu personal desde el directorio de Colaboradores (RRHH) para verlos aquí.
                </p>
                <Link href="/rrhh/empleados">
                  <Button className="bg-brand-1 hover:bg-brand-2 text-white font-bold">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ir a Colaboradores
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Colaborador / Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Salario Base</TableHead>
                    <TableHead>Tasa Riesgo</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colaboradoresFiltrados.map(col => (
                    <TableRow key={col.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{col.cedula}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{col.nombre}</div>
                        <div className="text-xs text-muted-foreground">{col.cargo}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{col.departamento}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{col.tipoContrato}</div>
                        <div className="text-xs text-muted-foreground">{new Date(col.fechaIngreso).toLocaleDateString('es-PA')}</div>
                      </TableCell>
                      <TableCell className="font-bold text-base">{formatMoney(Number(col.salarioBase))}</TableCell>
                      <TableCell className="text-xs font-medium">{(col.tasaRiesgo * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => simularColaborador(col)}
                          className="text-xs"
                        >
                          🧮 Simular Planilla
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="font-semibold text-foreground">Cumplimiento Ley 81 de 2019 de Protección de Datos Personales:</strong> Esta información se consulta en vivo desde el backend Prisma + Postgres, con seguridad de filas (RLS) habilitada y aislamiento por empresa. No se almacena en el navegador.
            </div>
          </div>
        </div>
      )}

      {/* VISTA 4: DÉCIMO TERCER MES */}
      {activeTab === 'decimo' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">🎁 Proyección de Décimo Tercer Mes (XIII Mes)</h2>
            <p className="text-sm text-muted-foreground">
              Cálculo de las 3 partidas obligatorias (15 de abril, 15 de agosto, 15 de diciembre) según Código de Trabajo.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monto Devengado en el Cuatrimestre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Total Devengado en el Cuatrimestre ($)</label>
                  <Input
                    type="number"
                    value={decAcumulado}
                    onChange={e => setDecAcumulado(Math.max(0, parseFloat(e.target.value) || 0))}
                    step="50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Promedio Mensual Equivalente</label>
                  <Input
                    type="text"
                    value={formatMoney(decAcumulado / 4)}
                    disabled
                    className="bg-muted text-muted-foreground font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-t-4 border-t-cyan-500">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-600 dark:text-cyan-400">Deducción al Trabajador en el XIII Mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Monto Bruto de la Partida (1/12 devengado):</span>
                  <strong className="font-semibold">{formatMoney(decCalc.montoBruto)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Seguro Social Especial (7.25%):</span>
                  <span className="text-red-500 font-medium">-{formatMoney(decCalc.cssObrero)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Seguro Educativo (Exento por Ley):</span>
                  <span className="text-muted-foreground">$0.00</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-border text-base font-bold">
                  <span>PAGO NETO A RECIBIR:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xl">{formatMoney(decCalc.montoNeto)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500">
              <CardHeader>
                <CardTitle className="text-lg text-amber-600 dark:text-amber-400">Aporte Patronal sobre el XIII Mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Monto Bruto del XIII Mes:</span>
                  <strong className="font-semibold">{formatMoney(decCalc.montoBruto)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>CSS Patronal sobre Décimo (10.75%):</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{formatMoney(decCalc.cssPatronal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Seguro Educativo Patronal (Exento):</span>
                  <span className="text-muted-foreground">$0.00</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-border text-base font-bold">
                  <span>COSTO TOTAL DÉCIMO PARA LA EMPRESA:</span>
                  <span className="text-foreground text-xl">{formatMoney(decCalc.montoBruto + decCalc.cssPatronal)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* VISTA 5: LIQUIDACIONES LABORALES */}
      {activeTab === 'liquidaciones' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">⚖️ Simulador de Liquidación Laboral (Finiquito)</h2>
            <p className="text-sm text-muted-foreground">
              Cálculo preciso de derechos adquiridos y estimación de indemnización según el Código de Trabajo de Panamá.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de Antigüedad del Colaborador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Salario Mensual Promedio ($)</label>
                  <Input
                    type="number"
                    value={liqSalario}
                    onChange={e => setLiqSalario(Math.max(0, parseFloat(e.target.value) || 0))}
                    step="50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Meses Laborados Totales</label>
                  <Input
                    type="number"
                    value={liqMeses}
                    onChange={e => {
                      const m = Math.max(0, parseFloat(e.target.value) || 0);
                      setLiqMeses(m);
                      setLiqAnios(parseFloat((m / 12).toFixed(2)));
                    }}
                    step="1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Años Equivalentes</label>
                  <Input
                    type="number"
                    value={liqAnios}
                    onChange={e => {
                      const a = Math.max(0, parseFloat(e.target.value) || 0);
                      setLiqAnios(a);
                      setLiqMeses(Math.round(a * 12));
                    }}
                    step="0.25"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-t-4 border-t-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-600 dark:text-emerald-400">✅ Derechos Adquiridos (Renuncia o Despido Justificado)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Vacaciones Proporcionales (1/11 devengado):</span>
                  <strong className="font-semibold">{formatMoney(liqCalc.vacacionesProporcionales)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>XIII Mes Proporcional (Neto al día):</span>
                  <strong className="font-semibold">{formatMoney(liqCalc.decimoTercerMesProporcionalNeto)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Prima de Antigüedad (1 semana por año lab.):</span>
                  <strong className="font-semibold">{formatMoney(liqCalc.primaAntiguedad)}</strong>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-border text-base font-bold">
                  <span>TOTAL DERECHOS ADQUIRIDOS:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xl">{formatMoney(liqCalc.totalDerechosAdquiridos)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500">
              <CardHeader>
                <CardTitle className="text-lg text-amber-600 dark:text-amber-400">⚠️ Escenario por Despido Injustificado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Preaviso Estimado (1 mes si se omite):</span>
                  <strong className="font-semibold">{formatMoney(liqCalc.preavisoEstimado)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Indemnización (Escala 3.4 sem/año Art. 225):</span>
                  <strong className="font-semibold">{formatMoney(liqCalc.indemnizacionEstimada)}</strong>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-border text-base font-bold">
                  <span>TOTAL CON DESPIDO INJUSTIFICADO:</span>
                  <span className="text-amber-600 dark:text-amber-400 text-xl">{formatMoney(liqCalc.totalConDespidoInjustificado)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
