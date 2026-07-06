'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
    Calendar,
    Filter,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/currency';

export interface LineaAsientoView {
  id: string;
  cuenta: {
    codigo: string;
    nombre: string;
    tipo: string;
  };
  debe: number;
  haber: number;
  descripcion: string | null;
}

export interface AsientoView {
  id: string;
  numero: number;
  fecha: string; // ISO
  concepto: string;
  origen: string;
  origenId: string | null;
  totalDebe: number;
  totalHaber: number;
  estado: string;
  usuario: {
    nombre: string;
  };
  lineas: LineaAsientoView[];
}

interface JournalListProps {
  initialData: AsientoView[];
  totalDebeGlobal: number;
  totalHaberGlobal: number;
  initialFilters: {
    startDate?: string;
    endDate?: string;
    origen?: string;
  };
}

export function JournalList({ 
  initialData, 
  totalDebeGlobal, 
  totalHaberGlobal, 
  initialFilters 
}: JournalListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expandedAsientos, setExpandedAsientos] = useState<Record<string, boolean>>({});
  const [startDate, setStartDate] = useState(initialFilters.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters.endDate || '');
  const [origen, setOrigen] = useState(initialFilters.origen || 'all');

  const toggleRow = (id: string) => {
    setExpandedAsientos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');

    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');

    if (origen && origen !== 'all') params.set('origen', origen);
    else params.delete('origen');

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setOrigen('all');
    router.push(pathname);
  };

  const isBalanced = Math.abs(totalDebeGlobal - totalHaberGlobal) < 0.01;

  return (
    <ContentContainer>
      <div className="space-y-6">
        {/* Resumen Contable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/50 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Débitos (Debe)</div>
              <div className="mt-2 text-2xl font-bold text-slate-800 font-mono">{formatCurrency(totalDebeGlobal)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Créditos (Haber)</div>
              <div className="mt-2 text-2xl font-bold text-slate-800 font-mono">{formatCurrency(totalHaberGlobal)}</div>
            </CardContent>
          </Card>
          <Card className={`backdrop-blur-md border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${isBalanced ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado de Cuadrado</div>
              <div className="mt-2 flex items-center gap-2">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <span className="text-lg font-bold text-emerald-800">Asientos Cuadrados</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-rose-600" />
                    <span className="text-lg font-bold text-rose-800">Descuadre Detectado</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-5 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha Desde</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="pl-9 h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="pl-9 h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Origen</label>
              <Select value={origen} onValueChange={setOrigen}>
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Todos los orígenes" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos los orígenes</SelectItem>
                  <SelectItem value="FACTURA">Venta (FACTURA)</SelectItem>
                  <SelectItem value="COBRO">Cobro (COBRO)</SelectItem>
                  <SelectItem value="COMPRA">Compra (COMPRA)</SelectItem>
                  <SelectItem value="PAGO_PROVEEDOR">Pago (PAGO_PROVEEDOR)</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={applyFilters} className="h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex-1 md:flex-initial">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={clearFilters} className="h-10 border-slate-200 text-slate-600 rounded-xl flex-1 md:flex-initial">
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Asientos */}
        <Card className="bg-white/80 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origen</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Debe</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Haber</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                    No se encontraron asientos contables registrados para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((asiento) => {
                  const expanded = expandedAsientos[asiento.id];
                  return (
                    <>
                      <TableRow 
                        key={asiento.id} 
                        className="cursor-pointer border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors"
                        onClick={() => toggleRow(asiento.id)}
                      >
                        <TableCell className="p-4" onClick={(e) => { e.stopPropagation(); toggleRow(asiento.id); }}>
                          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700 font-mono">
                          #{String(asiento.numero).padStart(6, '0')}
                        </TableCell>
                        <TableCell className="text-slate-600 whitespace-nowrap">
                          {new Date(asiento.fecha).toLocaleDateString('es-PA', { timeZone: 'UTC' })}
                        </TableCell>
                        <TableCell className="text-slate-700 font-medium max-w-xs truncate">
                          {asiento.concepto}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-semibold rounded-lg px-2 py-0.5 text-[10px] ${
                            asiento.origen === 'FACTURA' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                            asiento.origen === 'COBRO' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            asiento.origen === 'COMPRA' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            asiento.origen === 'PAGO_PROVEEDOR' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                            'bg-slate-50 border-slate-100 text-slate-700'
                          }`}>
                            {asiento.origen}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-slate-700">
                          {formatCurrency(asiento.totalDebe)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-slate-700">
                          {formatCurrency(asiento.totalHaber)}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {asiento.usuario.nombre}
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow className="bg-slate-50/20 border-b border-slate-100 hover:bg-slate-50/20">
                          <TableCell colSpan={8} className="p-4 pl-12">
                            <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                              <Table>
                                <TableHeader className="bg-slate-50/40">
                                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Código</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/3">Cuenta</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-1/6">Debe</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-1/6">Haber</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {asiento.lineas.map((linea) => (
                                    <TableRow key={linea.id} className="border-b border-slate-100/30 last:border-0 hover:bg-slate-50/10">
                                      <TableCell className="font-mono text-xs text-slate-500">{linea.cuenta.codigo}</TableCell>
                                      <TableCell className="text-xs font-medium text-slate-700">{linea.cuenta.nombre}</TableCell>
                                      <TableCell className="text-right font-mono text-xs text-slate-700">
                                        {linea.debe > 0 ? formatCurrency(linea.debe) : '-'}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-xs text-slate-700">
                                        {linea.haber > 0 ? formatCurrency(linea.haber) : '-'}
                                      </TableCell>
                                      <TableCell className="text-xs text-slate-500 max-w-xxs truncate">
                                        {linea.descripcion || '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </ContentContainer>
  );
}
