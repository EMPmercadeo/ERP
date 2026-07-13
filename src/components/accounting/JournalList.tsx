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
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Débitos (Debe)</div>
              <div className="mt-2 text-2xl font-bold text-foreground font-mono">{formatCurrency(totalDebeGlobal)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Créditos (Haber)</div>
              <div className="mt-2 text-2xl font-bold text-foreground font-mono">{formatCurrency(totalHaberGlobal)}</div>
            </CardContent>
          </Card>
          <Card className={`border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${isBalanced ? 'bg-success-bg border-success/30' : 'bg-danger-bg border-danger/30'}`}>
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado de Cuadrado</div>
              <div className="mt-2 flex items-center gap-2">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <span className="text-lg font-bold text-success">Asientos Cuadrados</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-danger" />
                    <span className="text-lg font-bold text-danger">Descuadre Detectado</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-card border-border shadow-sm rounded-2xl">
          <CardContent className="p-5 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha Desde</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="pl-9 h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="pl-9 h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-xl"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-semibold">Origen</label>
              <Select value={origen} onValueChange={setOrigen}>
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-xl">
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
              <Button onClick={applyFilters} className="h-10 bg-card hover:bg-accent text-white rounded-xl flex-1 md:flex-initial">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" onClick={clearFilters} className="h-10 border-border text-muted-foreground rounded-xl flex-1 md:flex-initial">
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Asientos */}
        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Número</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Concepto</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origen</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Debe</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Haber</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
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
                        className="cursor-pointer border-b border-border/50 hover:bg-accent/30 transition-colors"
                        onClick={() => toggleRow(asiento.id)}
                      >
                        <TableCell className="p-4" onClick={(e) => { e.stopPropagation(); toggleRow(asiento.id); }}>
                          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground font-mono">
                          #{String(asiento.numero).padStart(6, '0')}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(asiento.fecha).toLocaleDateString('es-PA', { timeZone: 'UTC' })}
                        </TableCell>
                        <TableCell className="text-foreground font-medium max-w-xs truncate">
                          {asiento.concepto}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-semibold rounded-lg px-2 py-0.5 text-[10px] ${
                            asiento.origen === 'FACTURA' ? 'bg-info-bg border-info/20 text-info' :
                            asiento.origen === 'COBRO' ? 'bg-success-bg border-success/20 text-success' :
                            asiento.origen === 'COMPRA' ? 'bg-warning-bg border-warning/20 text-warning' :
                            asiento.origen === 'PAGO_PROVEEDOR' ? 'bg-danger-bg border-danger/20 text-danger' :
                            'bg-muted border-border text-foreground'
                          }`}>
                            {asiento.origen}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-foreground">
                          {formatCurrency(asiento.totalDebe)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-foreground">
                          {formatCurrency(asiento.totalHaber)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {asiento.usuario.nombre}
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow className="bg-muted/20 border-b border-border hover:bg-muted/20">
                          <TableCell colSpan={8} className="p-4 pl-12">
                            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
                              <Table>
                                <TableHeader className="bg-muted/40">
                                  <TableRow className="border-b border-border hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-1/4">Código</TableHead>
                                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-1/3">Cuenta</TableHead>
                                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-1/6">Debe</TableHead>
                                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-1/6">Haber</TableHead>
                                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descripción</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {asiento.lineas.map((linea) => (
                                    <TableRow key={linea.id} className="border-b border-border/30 last:border-0 hover:bg-accent/10">
                                      <TableCell className="font-mono text-xs text-muted-foreground">{linea.cuenta.codigo}</TableCell>
                                      <TableCell className="text-xs font-medium text-foreground">{linea.cuenta.nombre}</TableCell>
                                      <TableCell className="text-right font-mono text-xs text-foreground">
                                        {linea.debe > 0 ? formatCurrency(linea.debe) : '-'}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-xs text-foreground">
                                        {linea.haber > 0 ? formatCurrency(linea.haber) : '-'}
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground max-w-xxs truncate">
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
