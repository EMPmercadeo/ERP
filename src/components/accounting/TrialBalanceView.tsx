'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Calendar,
    CheckCircle2,
    AlertCircle,
    ArrowDownToLine
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

export interface TrialBalanceItem {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
  debeAcumulado: number;
  haberAcumulado: number;
  deudor: number;
  acreedor: number;
}

interface TrialBalanceViewProps {
  initialData: TrialBalanceItem[];
  totalDeudor: number;
  totalAcreedor: number;
  initialFilters: {
    cutOffDate?: string;
  };
}

export function TrialBalanceView({
  initialData,
  totalDeudor,
  totalAcreedor,
  initialFilters
}: TrialBalanceViewProps) {
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

  const isBalanced = Math.abs(totalDeudor - totalAcreedor) < 0.01;

  return (
    <ContentContainer>
      <div className="space-y-6">
        {/* Resumen de Balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Deudor</div>
              <div className="mt-2 text-2xl font-bold text-foreground font-mono">{formatCurrency(totalDeudor)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Acreedor</div>
              <div className="mt-2 text-2xl font-bold text-foreground font-mono">{formatCurrency(totalAcreedor)}</div>
            </CardContent>
          </Card>
          <Card className={`border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${isBalanced ? 'bg-success-bg border-success/30' : 'bg-danger-bg border-danger/30'}`}>
            <CardContent className="p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cuadre del Balance</div>
              <div className="mt-2 flex items-center gap-2">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <span className="text-lg font-bold text-success">Cuadrado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-danger" />
                    <span className="text-lg font-bold text-danger">Descuadrado</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-card border-border shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Fecha de Corte</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={cutOffDate} 
                  onChange={e => setCutOffDate(e.target.value)} 
                  className="pl-9 h-11 text-xs sm:text-sm bg-muted/50 border-border rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button onClick={applyFilters} className="h-11 bg-card hover:bg-accent text-white rounded-xl">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Calcular Balance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Balance de Comprobación */}
        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Código</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cuenta</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Naturaleza</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Saldo Deudor</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Saldo Acreedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No se encontraron cuentas contables registradas.
                  </TableCell>
                </TableRow>
              ) : (
                initialData.map((cuenta) => (
                  <TableRow key={cuenta.id} className="border-b border-border/50 hover:bg-accent/10">
                    <TableCell className="font-mono text-xs text-muted-foreground font-semibold">{cuenta.codigo}</TableCell>
                    <TableCell className={`text-xs font-medium ${cuenta.codigo.split('.').length === 1 ? 'font-bold text-foreground' : 'text-foreground'}`}>
                      {cuenta.nombre}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{cuenta.tipo}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{cuenta.naturaleza}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground font-medium">
                      {cuenta.deudor !== 0 ? formatCurrency(cuenta.deudor) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground font-medium">
                      {cuenta.acreedor !== 0 ? formatCurrency(cuenta.acreedor) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </ContentContainer>
  );
}
