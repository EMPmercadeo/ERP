'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Calendar,
    CheckCircle2,
    AlertCircle,
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
    TableRow
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/currency';

export interface BalanceSheetAccount {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  balance: number;
}

interface BalanceSheetViewProps {
  activos: BalanceSheetAccount[];
  pasivos: BalanceSheetAccount[];
  patrimonios: BalanceSheetAccount[];
  utilidadEjercicio: number;
  totalActivos: number;
  totalPasivos: number;
  totalPatrimonioSinUtilidad: number;
  initialFilters: {
    cutOffDate?: string;
  };
}

export function BalanceSheetView({
  activos,
  pasivos,
  patrimonios,
  utilidadEjercicio,
  totalActivos,
  totalPasivos,
  totalPatrimonioSinUtilidad,
  initialFilters
}: BalanceSheetViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cutOffDate, setCutOffDate] = useState(initialFilters.cutOffDate || '');

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (cutOffDate) params.set('cutOffDate', cutOffDate);
    else params.delete('cutOffDate');
    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPatrimonioTotal = totalPatrimonioSinUtilidad + utilidadEjercicio;
  const totalPasivoPatrimonio = totalPasivos + totalPatrimonioTotal;
  const diferencia = totalActivos - totalPasivoPatrimonio;
  const isBalanced = Math.abs(diferencia) < 0.01;

  return (
    <ContentContainer>
      <div className="space-y-6">
        {/* Resumen de Balance Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/50 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activo Total</div>
              <div className="mt-2 text-2xl font-bold text-slate-800 font-mono">{formatCurrency(totalActivos)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pasivo + Patrimonio Total</div>
              <div className="mt-2 text-2xl font-bold text-slate-800 font-mono">{formatCurrency(totalPasivoPatrimonio)}</div>
            </CardContent>
          </Card>
          <Card className={`backdrop-blur-md border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${isBalanced ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100'}`}>
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado Ecuación Contable</div>
              <div className="mt-2 flex items-center gap-2">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <span className="text-lg font-bold text-emerald-800">Cuadrado (A = P + C)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-rose-600" />
                    <span className="text-lg font-bold text-rose-800">Descuadre ({formatCurrency(diferencia)})</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Fecha de Corte</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  value={cutOffDate} 
                  onChange={e => setCutOffDate(e.target.value)} 
                  className="pl-9 h-11 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button onClick={applyFilters} className="h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                Calcular Balance General
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance General Detallado */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden p-6 space-y-8">
          <div className="text-center pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Balance General</h2>
            <p className="text-xs text-slate-400 mt-1">
              Al {cutOffDate ? new Date(cutOffDate).toLocaleDateString('es-PA') : new Date().toLocaleDateString('es-PA')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lado Izquierdo: Activos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Activos</h3>
                <span className="font-mono text-sm font-bold text-slate-800">{formatCurrency(totalActivos)}</span>
              </div>
              <Table>
                <TableBody>
                  {activos.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="text-slate-400 py-3 text-xs">No se registran activos.</TableCell>
                    </TableRow>
                  ) : (
                    activos.map(a => (
                      <TableRow key={a.id} className="border-b border-slate-100/50 hover:bg-slate-50/10">
                        <TableCell className="font-mono text-[11px] text-slate-400 w-1/4">{a.codigo}</TableCell>
                        <TableCell className="text-xs text-slate-700 font-medium">{a.nombre}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-750 font-semibold">{formatCurrency(a.balance)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Lado Derecho: Pasivos y Patrimonios */}
            <div className="space-y-6">
              {/* Pasivos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pasivos</h3>
                  <span className="font-mono text-sm font-bold text-slate-800">{formatCurrency(totalPasivos)}</span>
                </div>
                <Table>
                  <TableBody>
                    {pasivos.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={3} className="text-slate-400 py-3 text-xs">No se registran pasivos.</TableCell>
                      </TableRow>
                    ) : (
                      pasivos.map(a => (
                        <TableRow key={a.id} className="border-b border-slate-100/50 hover:bg-slate-50/10">
                          <TableCell className="font-mono text-[11px] text-slate-400 w-1/4">{a.codigo}</TableCell>
                          <TableCell className="text-xs text-slate-700 font-medium">{a.nombre}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-slate-750 font-semibold">{formatCurrency(a.balance)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Patrimonios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Patrimonio</h3>
                  <span className="font-mono text-sm font-bold text-slate-800">{formatCurrency(totalPatrimonioTotal)}</span>
                </div>
                <Table>
                  <TableBody>
                    {patrimonios.map(a => (
                      <TableRow key={a.id} className="border-b border-slate-100/50 hover:bg-slate-50/10">
                        <TableCell className="font-mono text-[11px] text-slate-400 w-1/4">{a.codigo}</TableCell>
                        <TableCell className="text-xs text-slate-700 font-medium">{a.nombre}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-750 font-semibold">{formatCurrency(a.balance)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Fila Virtual: Utilidad del Ejercicio */}
                    <TableRow className="border-b border-slate-100/50 hover:bg-slate-50/10">
                      <TableCell className="font-mono text-[11px] text-slate-400 w-1/4">-</TableCell>
                      <TableCell className="text-xs text-slate-700 font-bold italic">Utilidad del Ejercicio (Ingresos - Gastos)</TableCell>
                      <TableCell className="text-right font-mono text-xs text-teal-600 font-black italic">{formatCurrency(utilidadEjercicio)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Cuadre Final */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wider">TOTAL ACTIVO</span>
              <span className="font-mono text-base font-black">{formatCurrency(totalActivos)}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wider">TOTAL PASIVO + PATRIMONIO</span>
              <span className="font-mono text-base font-black">{formatCurrency(totalPasivoPatrimonio)}</span>
            </div>
          </div>
        </Card>
      </div>
    </ContentContainer>
  );
}
