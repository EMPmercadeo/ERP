'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    BookOpen,
    ArrowUpRight,
    ArrowDownLeft,
    Calculator
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent } from '@/components/ui/card';


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

export interface PlanCuentaOption {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
}

export interface LedgerMovementView {
  id: string;
  fecha: string; // ISO
  asientoNumero: number;
  concepto: string;
  origen: string;
  debe: number;
  haber: number;
  descripcion: string | null;
  runningBalance: number;
}

interface LedgerViewProps {
  cuentas: PlanCuentaOption[];
  selectedCuentaId: string;
  movements: LedgerMovementView[];
  totalDebe: number;
  totalHaber: number;
  saldoFinal: number;
  naturaleza: string;
}

export function LedgerView({
  cuentas,
  selectedCuentaId,
  movements,
  totalDebe,
  totalHaber,
  saldoFinal,
  naturaleza
}: LedgerViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cuentaId, setCuentaId] = useState(selectedCuentaId || 'none');

  const handleCuentaChange = (value: string) => {
    setCuentaId(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'none') {
      params.set('cuentaId', value);
    } else {
      params.delete('cuentaId');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectedCuenta = cuentas.find(c => c.id === selectedCuentaId);

  return (
    <ContentContainer>
      <div className="space-y-6">
        {/* Selección de Cuenta */}
        <Card className="bg-white/80 backdrop-blur-md border-border shadow-sm rounded-2xl">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Seleccionar Cuenta Contable</label>
              <Select value={cuentaId} onValueChange={handleCuentaChange}>
                <SelectTrigger className="h-11 text-xs sm:text-sm bg-muted/50 border-border rounded-xl w-full md:max-w-md">
                  <SelectValue placeholder="Selecciona una cuenta..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-80">
                  <SelectItem value="none" className="text-muted-foreground cursor-pointer">Selecciona una cuenta...</SelectItem>
                  {cuentas.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="cursor-pointer font-mono text-xs sm:text-sm">
                      {c.codigo} &mdash; {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCuenta && (
              <div className="flex items-center gap-3 bg-muted/80 border border-border rounded-xl px-4 py-3">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Detalles Cuenta</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">
                    Tipo: <span className="font-bold text-foreground">{selectedCuenta.tipo}</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">
                    Naturaleza: <span className="font-bold text-foreground">{selectedCuenta.naturaleza}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCuentaId === 'none' || !selectedCuentaId ? (
          <Card className="bg-white/80 border border-border rounded-2xl p-12 text-center shadow-xs">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-base font-bold text-foreground mb-1">Libro Mayor</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Selecciona una cuenta contable en el buscador superior para visualizar sus movimientos y saldo acumulado.
            </p>
          </Card>
        ) : (
          <>
            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/50 backdrop-blur-md border-border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    Total Débitos (Debe)
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground font-mono">{formatCurrency(totalDebe)}</div>
                </CardContent>
              </Card>
              <Card className="bg-white/50 backdrop-blur-md border-border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownLeft className="h-4 w-4 text-rose-500" />
                    Total Créditos (Haber)
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground font-mono">{formatCurrency(totalHaber)}</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="h-4 w-4 text-teal-400" />
                    Saldo Final ({naturaleza})
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white font-mono">{formatCurrency(saldoFinal)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de Movimientos */}
            <Card className="bg-white/80 backdrop-blur-md border-border shadow-sm rounded-2xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asiento</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Concepto</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origen</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detalle/Descripción</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Debe</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Haber</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Saldo Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No se registran movimientos para esta cuenta contable.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((mov) => (
                      <TableRow key={mov.id} className="border-b border-border/50 hover:bg-accent/10">
                        <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(mov.fecha).toLocaleDateString('es-PA', { timeZone: 'UTC' })}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground font-mono text-xs">
                          #{String(mov.asientoNumero).padStart(6, '0')}
                        </TableCell>
                        <TableCell className="text-foreground text-xs font-medium max-w-xxs truncate">
                          {mov.concepto}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-semibold rounded-lg px-2 py-0.5 text-[9px] ${
                            mov.origen === 'FACTURA' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                            mov.origen === 'COBRO' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            mov.origen === 'COMPRA' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            mov.origen === 'PAGO_PROVEEDOR' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                            'bg-muted border-border text-foreground'
                          }`}>
                            {mov.origen}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-xxs truncate">
                          {mov.descripcion || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground font-medium">
                          {mov.debe > 0 ? formatCurrency(mov.debe) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground font-medium">
                          {mov.haber > 0 ? formatCurrency(mov.haber) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                          {formatCurrency(mov.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </ContentContainer>
  );
}
