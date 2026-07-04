'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Percent, 
  Filter 
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/currency';

export interface IncomeStatementAccount {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  balance: number;
}

interface IncomeStatementViewProps {
  ingresos: IncomeStatementAccount[];
  costos: IncomeStatementAccount[];
  gastos: IncomeStatementAccount[];
  totalIngresos: number;
  totalCostos: number;
  totalGastos: number;
  utilidadBruta: number;
  utilidadNeta: number;
  initialFilters: {
    startDate?: string;
    endDate?: string;
  };
}

export function IncomeStatementView({
  ingresos,
  costos,
  gastos,
  totalIngresos,
  totalCostos,
  totalGastos,
  utilidadBruta,
  utilidadNeta,
  initialFilters
}: IncomeStatementViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(initialFilters.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters.endDate || '');

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');

    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    router.push(pathname);
  };

  return (
    <ContentContainer>
      <div className="space-y-6">
        {/* Resumen de Utilidades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/50 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ingresos</div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(totalIngresos)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilidad Bruta</div>
              <div className="mt-2 text-2xl font-bold text-slate-800 font-mono">{formatCurrency(utilidadBruta)}</div>
              <div className="text-[10px] text-slate-450 mt-1">Ingresos - Costos</div>
            </CardContent>
          </Card>
          <Card className={`backdrop-blur-md border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${utilidadNeta >= 0 ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100'}`}>
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilidad Neta (Ejercicio)</div>
              <div className={`mt-2 text-2xl font-bold font-mono ${utilidadNeta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(utilidadNeta)}
              </div>
              <div className="text-[10px] text-slate-450 mt-1">Utilidad Bruta - Gastos</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Fecha Desde</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="pl-9 h-11 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Fecha Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="pl-9 h-11 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button onClick={applyFilters} className="h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={clearFilters} className="h-11 border-slate-200 text-slate-600 rounded-xl">
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado de Resultados Detallado */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden p-6 space-y-8">
          <div className="text-center pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Estado de Resultados</h2>
            <p className="text-xs text-slate-400 mt-1">
              Período: {startDate ? new Date(startDate).toLocaleDateString('es-PA') : 'Inicio'} &mdash; {endDate ? new Date(endDate).toLocaleDateString('es-PA') : 'Presente'}
            </p>
          </div>

          {/* Sección 1: Ingresos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. Ingresos Operacionales</h3>
              <span className="font-mono text-sm font-bold text-emerald-600">{formatCurrency(totalIngresos)}</span>
            </div>
            <Table>
              <TableBody>
                {ingresos.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-slate-400 py-3 text-xs">No se registran ingresos.</TableCell>
                  </TableRow>
                ) : (
                  ingresos.map(a => (
                    <TableRow key={a.id} className="border-b border-slate-100/50 hover:bg-slate-50/10">
                      <TableCell className="font-mono text-xs text-slate-400 w-1/4">{a.codigo}</TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">{a.nombre}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-750 font-semibold">{formatCurrency(a.balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Sección 2: Costos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-850 pb-1.5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. Costo de Ventas</h3>
              <span className="font-mono text-sm font-bold text-slate-750">{formatCurrency(totalCostos)}</span>
            </div>
            <Table>
              <TableBody>
                {costos.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-slate-400 py-3 text-xs">No se registran costos de venta.</TableCell>
                  </TableRow>
                ) : (
                  costos.map(a => (
                    <TableRow key={a.id} className="border-b border-slate-100/50 hover:bg-slate-50/10">
                      <TableCell className="font-mono text-xs text-slate-400 w-1/4">{a.codigo}</TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">{a.nombre}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-750 font-semibold">{formatCurrency(a.balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Utilidad Bruta */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-xl px-4 py-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">UTILIDAD BRUTA</span>
            <span className="font-mono text-sm font-bold text-slate-800">{formatCurrency(utilidadBruta)}</span>
          </div>

          {/* Sección 3: Gastos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-850 pb-1.5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">3. Gastos Operacionales</h3>
              <span className="font-mono text-sm font-bold text-slate-750">{formatCurrency(totalGastos)}</span>
            </div>
            <Table>
              <TableBody>
                {gastos.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-slate-400 py-3 text-xs">No se registran gastos.</TableCell>
                  </TableRow>
                ) : (
                  gastos.map(a => (
                    <TableRow key={a.id} className="border-b border-slate-100/50 hover:bg-slate-50/10">
                      <TableCell className="font-mono text-xs text-slate-400 w-1/4">{a.codigo}</TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">{a.nombre}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-750 font-semibold">{formatCurrency(a.balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Utilidad Neta */}
          <div className={`flex items-center justify-between border rounded-xl px-4 py-4 ${utilidadNeta >= 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'}`}>
            <span className="text-sm font-bold uppercase tracking-wider">UTILIDAD NETA DEL EJERCICIO</span>
            <span className="font-mono text-base font-black">{formatCurrency(utilidadNeta)}</span>
          </div>
        </Card>
      </div>
    </ContentContainer>
  );
}
