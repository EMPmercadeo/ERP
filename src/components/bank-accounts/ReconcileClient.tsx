'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Link2, Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { reconciliarMovimiento } from '@/lib/actions/bank-accounts';

export interface MovimientoParaConciliar {
    id: string;
    fecha: string;
    descripcion: string;
    monto: number;
    tipo: string;
    referencia: string | null;
    origenImportacion: string | null;
}

export interface LineaParaConciliar {
    id: string;
    asientoContableId: string;
    asientoNumero: number;
    fecha: string;
    concepto: string;
    origen: string;
    debe: number;
    haber: number;
    descripcion: string | null;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ReconcileClient({
    cuentaId,
    cuentaNombre,
    cuentaContableLabel,
    movimientos: initialMovimientos,
    lineas: initialLineas,
}: {
    cuentaId: string;
    cuentaNombre: string;
    cuentaContableLabel: string;
    movimientos: MovimientoParaConciliar[];
    lineas: LineaParaConciliar[];
}) {
    const [movimientos, setMovimientos] = useState(initialMovimientos);
    const [lineas, setLineas] = useState(initialLineas);
    const [selectedMovimiento, setSelectedMovimiento] = useState<string | null>(null);
    const [selectedAsiento, setSelectedAsiento] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReconciliar = async () => {
        if (!selectedMovimiento || !selectedAsiento) return;
        setLoading(true);
        try {
            const res = await reconciliarMovimiento(cuentaId, selectedMovimiento, selectedAsiento);
            if (res.success) {
                toast.success(res.message);
                setMovimientos((prev) => prev.filter((m) => m.id !== selectedMovimiento));
                setLineas((prev) => prev.filter((l) => l.asientoContableId !== selectedAsiento));
                setSelectedMovimiento(null);
                setSelectedAsiento(null);
                router.refresh();
            } else {
                toast.error(res.error || 'Error al conciliar');
            }
        } catch {
            toast.error('Error inesperado al conciliar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ContentContainer className="py-4 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/bank-accounts/${cuentaId}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Conciliación Bancaria</h2>
                        <p className="text-muted-foreground text-sm">
                            {cuentaNombre} · Cuenta contable {cuentaContableLabel}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleReconciliar}
                    disabled={!selectedMovimiento || !selectedAsiento || loading}
                    className="bg-brand-1 text-white hover:bg-brand-1/90"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                    Conciliar Selección
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Movimientos Bancarios sin Conciliar ({movimientos.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[560px] overflow-y-auto">
                        {movimientos.length > 0 ? (
                            movimientos.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMovimiento(m.id === selectedMovimiento ? null : m.id)}
                                    className={cn(
                                        'w-full text-left border rounded-lg p-3 transition-colors',
                                        selectedMovimiento === m.id
                                            ? 'border-brand-1 bg-brand-1/5 ring-1 ring-brand-1'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">{formatDate(m.fecha)}</span>
                                        <Badge variant={m.tipo === 'DEPOSITO' ? 'success' : 'destructive'} className="text-[10px]">
                                            {m.tipo === 'DEPOSITO' ? 'Depósito' : 'Retiro'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{m.descripcion}</p>
                                    <p className={cn('font-mono text-sm font-bold mt-1', m.tipo === 'DEPOSITO' ? 'text-emerald-600' : 'text-red-600')}>
                                        {m.tipo === 'DEPOSITO' ? '+' : '-'}{formatCurrency(m.monto)}
                                    </p>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No hay movimientos bancarios pendientes de conciliar.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Asientos Contables sin Conciliar ({lineas.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[560px] overflow-y-auto">
                        {lineas.length > 0 ? (
                            lineas.map((l) => (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => setSelectedAsiento(l.asientoContableId === selectedAsiento ? null : l.asientoContableId)}
                                    className={cn(
                                        'w-full text-left border rounded-lg p-3 transition-colors',
                                        selectedAsiento === l.asientoContableId
                                            ? 'border-brand-1 bg-brand-1/5 ring-1 ring-brand-1'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">{formatDate(l.fecha)} · Asiento #{l.asientoNumero}</span>
                                        <Badge variant="neutral" className="text-[10px]">{l.origen}</Badge>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{l.concepto}</p>
                                    <p className="font-mono text-xs mt-1 text-slate-600">
                                        Debe: {formatCurrency(l.debe)} · Haber: {formatCurrency(l.haber)}
                                    </p>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No hay líneas de asiento pendientes de conciliar para esta cuenta contable.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ContentContainer>
    );
}
