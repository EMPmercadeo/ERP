'use client';

/**
 * Panel de abastecimiento: el "anuncio" de qué se está acabando.
 *
 * Cada tarjeta responde, en orden, las preguntas que el dueño se hace de verdad:
 * qué queda, para cuántos productos terminados alcanza, cuánto dura al ritmo actual,
 * y a quién pedirle cuánto y por cuánto dinero.
 *
 * Se ordena por urgencia real (agotado -> crítico -> pronto), no alfabéticamente:
 * lo primero que se ve es lo que hay que resolver hoy.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, PackageSearch, RefreshCw, ShoppingCart, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { getAlertasReabastecimiento } from '@/lib/actions/proveedor-insumos';
import type { AlertaReabastecimiento, SeveridadReabastecimiento } from '@/lib/services/reabastecimientoCore';

const ETIQUETA_SEVERIDAD: Record<SeveridadReabastecimiento, string> = {
    agotado: 'Agotado',
    critico: 'Crítico',
    pronto: 'Pedir pronto',
    ok: 'En orden',
};

const VARIANTE_SEVERIDAD: Record<SeveridadReabastecimiento, 'destructive' | 'warning' | 'info' | 'success'> = {
    agotado: 'destructive',
    critico: 'destructive',
    pronto: 'warning',
    ok: 'success',
};

function formatearNumero(n: number): string {
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString('es-PA');
    if (Number.isInteger(n)) return n.toString();
    return Number(n.toFixed(1)).toString();
}

function formatearCobertura(dias: number | null): string {
    if (dias === null) return 'Sin consumo medido';
    if (dias < 1) return 'Menos de un día';
    if (dias < 2) return 'Un día';
    return `${Math.floor(dias)} días`;
}

export function AbastecimientoPanel() {
    const [loading, setLoading] = useState(true);
    const [alertas, setAlertas] = useState<AlertaReabastecimiento[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [dias, setDias] = useState('30');
    const [incluirOk, setIncluirOk] = useState(false);

    const cargar = async (diasHistorial: string, verTodo: boolean) => {
        setLoading(true);
        const res = await getAlertasReabastecimiento({ dias: Number(diasHistorial), incluirOk: verTodo });
        setAlertas(res.alertas);
        setError(res.error ?? null);
        setLoading(false);
    };

    useEffect(() => {
        cargar(dias, incluirOk);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dias, incluirOk]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-brand-1" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="error" className="text-xs font-semibold">
                <span>{error}</span>
            </Alert>
        );
    }

    const costoTotal = alertas.reduce((sum, a) => sum + (a.proveedor?.compra.costoEstimado ?? 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground max-w-2xl">
                        Calculado desde tus ventas reales: cuánto se consume por día de cada insumo, cuánto dura lo
                        que queda y cuándo hay que pedir para que el proveedor llegue a tiempo.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Select value={dias} onValueChange={setDias}>
                        <SelectTrigger className="h-9 text-xs w-40" aria-label="Período de historial">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                            <SelectItem value="7" className="text-xs cursor-pointer">
                                Últimos 7 días
                            </SelectItem>
                            <SelectItem value="15" className="text-xs cursor-pointer">
                                Últimos 15 días
                            </SelectItem>
                            <SelectItem value="30" className="text-xs cursor-pointer">
                                Últimos 30 días
                            </SelectItem>
                            <SelectItem value="90" className="text-xs cursor-pointer">
                                Últimos 90 días
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIncluirOk(!incluirOk)}
                        className="h-9 text-xs font-bold"
                    >
                        {incluirOk ? 'Solo alertas' : 'Ver todos'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => cargar(dias, incluirOk)}
                        className="h-9 w-9"
                        aria-label="Recalcular"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {alertas.length === 0 ? (
                <div className="border border-border rounded-xl bg-card shadow-sm py-16 px-6 text-center space-y-2">
                    <PackageSearch className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-bold text-foreground">Nada por reabastecer</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Ningún insumo está por debajo de su punto de reorden. Si esperabas ver algo aquí, revisa que
                        tus productos tengan receta y que sus insumos tengan un proveedor con presentación registrada.
                    </p>
                </div>
            ) : (
                <>
                    {costoTotal > 0 && (
                        <div className="bg-muted rounded-xl p-3 border border-border flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Costo estimado de reponer todo
                            </span>
                            <span className="text-sm font-bold text-brand-1 font-mono">
                                {formatCurrency(costoTotal)}
                            </span>
                        </div>
                    )}

                    <div className="space-y-3">
                        {alertas.map((a) => (
                            <div
                                key={a.insumoId}
                                className={cn(
                                    'border rounded-xl bg-card shadow-sm p-4 space-y-3',
                                    a.severidad === 'agotado' || a.severidad === 'critico'
                                        ? 'border-danger/30'
                                        : 'border-border'
                                )}
                            >
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/products/${a.insumoId}`}
                                                className="text-sm font-bold text-foreground hover:text-brand-1"
                                            >
                                                {a.descripcion}
                                            </Link>
                                            <Badge
                                                variant={VARIANTE_SEVERIDAD[a.severidad]}
                                                className="text-[10px] font-bold"
                                            >
                                                {ETIQUETA_SEVERIDAD[a.severidad]}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-mono">
                                            {a.codigoInterno}
                                        </p>
                                    </div>
                                    {a.proveedor && (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs shrink-0"
                                        >
                                            <Link href={`/purchases/new?proveedorId=${a.proveedor.proveedorId}`}>
                                                <ShoppingCart className="h-4 w-4 mr-1.5" />
                                                Registrar compra
                                            </Link>
                                        </Button>
                                    )}
                                </div>

                                <p className="text-xs text-foreground leading-relaxed">{a.mensaje}</p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Stock actual
                                        </div>
                                        <div className="text-xs font-bold text-foreground font-mono">
                                            {formatearNumero(a.stockActual)} {a.unidadMedida.toLowerCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Consumo diario
                                        </div>
                                        <div className="text-xs font-bold text-foreground font-mono">
                                            {formatearNumero(a.consumoDiario)} {a.unidadMedida.toLowerCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Le queda
                                        </div>
                                        <div
                                            className={cn(
                                                'text-xs font-bold font-mono',
                                                a.diasCobertura !== null && a.diasCobertura < 2
                                                    ? 'text-destructive'
                                                    : 'text-foreground'
                                            )}
                                        >
                                            {formatearCobertura(a.diasCobertura)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Punto de reorden
                                        </div>
                                        <div className="text-xs font-bold text-foreground font-mono">
                                            {formatearNumero(a.puntoReorden)} {a.unidadMedida.toLowerCase()}
                                        </div>
                                    </div>
                                </div>

                                {a.impacto.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3" />
                                            Con lo que queda alcanza para
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {a.impacto.slice(0, 6).map((i) => (
                                                <Badge
                                                    key={i.productoId}
                                                    variant={i.esCuelloDeBotella ? 'warning' : 'neutral'}
                                                    className="text-[10px] font-semibold"
                                                >
                                                    {formatearNumero(i.unidadesPosibles)} {i.descripcion}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {a.proveedor ? (
                                    <div className="bg-muted rounded-lg p-3 border border-border space-y-1">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-foreground">
                                                {a.proveedor.compra.presentaciones} × {a.proveedor.presentacion} —{' '}
                                                {a.proveedor.proveedorNombre}
                                            </span>
                                            <span className="text-xs font-bold text-brand-1 font-mono">
                                                {formatCurrency(a.proveedor.compra.costoEstimado)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Llegan {formatearNumero(a.proveedor.compra.unidadesQueLlegan)}{' '}
                                            {a.unidadMedida.toLowerCase()}
                                            {a.proveedor.compra.excedente > 0 &&
                                                ` (sobran ${formatearNumero(a.proveedor.compra.excedente)} por comprar presentaciones completas)`}
                                            .
                                            {a.proveedor.diasEntrega > 0 &&
                                                ` Entrega en ${a.proveedor.diasEntrega} día${a.proveedor.diasEntrega === 1 ? '' : 's'}.`}
                                        </p>
                                        {a.alternativas.length > 0 && (
                                            <details className="pt-1">
                                                <summary className="text-[11px] font-bold text-brand-1 cursor-pointer">
                                                    Ver {a.alternativas.length} alternativa
                                                    {a.alternativas.length === 1 ? '' : 's'}
                                                </summary>
                                                <ul className="pt-1.5 space-y-1">
                                                    {a.alternativas.map((alt) => (
                                                        <li
                                                            key={alt.proveedorInsumoId}
                                                            className="text-[11px] text-muted-foreground flex justify-between gap-2"
                                                        >
                                                            <span>
                                                                {alt.compra.presentaciones} × {alt.presentacion} —{' '}
                                                                {alt.proveedorNombre}
                                                            </span>
                                                            <span className="font-mono">
                                                                {formatCurrency(alt.compra.costoEstimado)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </details>
                                        )}
                                    </div>
                                ) : (
                                    <Alert variant="warning" className="text-xs font-semibold">
                                        <span>
                                            No hay proveedor con presentación registrada para este insumo, así que no
                                            se puede sugerir cuánto pedir.{' '}
                                            <Link href={`/products/${a.insumoId}`} className="underline">
                                                Registrar uno
                                            </Link>
                                            .
                                        </span>
                                    </Alert>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default AbastecimientoPanel;
