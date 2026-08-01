import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatStrip — Design System v2 (reemplaza a KpiCard).
 *
 * Cuatro cifras dentro de UNA sola superficie, separadas por líneas de 1px, en vez de
 * cuatro cards flotando con 24px de aire cada una.
 *
 * El motivo es de lectura, no de estética: las cuatro cifras del dashboard (facturado,
 * cobrado, pendiente, vencido) son la misma magnitud vista desde cuatro ángulos, y hay
 * que compararlas entre sí. Cuando cada una vive en su propia card con su propio borde,
 * su propia sombra y su propio icono de color, el ojo las lee como cuatro cosas
 * distintas. En una tira compartida se leen como una sola frase.
 *
 * Por eso también las cifras van en mono tabular: los dígitos ocupan el mismo ancho, así
 * que las cuatro columnas quedan alineadas verticalmente y la comparación es inmediata.
 */

export interface StatItem {
    label: string;
    value: number;
    /** Variación porcentual contra el período anterior. */
    change?: number;
    trend?: 'up' | 'down';
    format?: 'currency' | 'number';
    href?: string;
    /** Semántica del dato, no decoración: pinta el punto de la etiqueta y la sparkline. */
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
    sparkPoints?: number[];
    sparkId: string;
}

const dotTone: Record<NonNullable<StatItem['tone']>, string> = {
    neutral: 'bg-brand-500',
    success: 'bg-success',
    warning: 'bg-warning-dot',
    danger: 'bg-danger',
};

const strokeTone: Record<NonNullable<StatItem['tone']>, string> = {
    neutral: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning-dot)',
    danger: 'var(--danger)',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value);
}

/** Curva suave de Catmull-Rom convertida a bézier, para que la línea no se vea quebrada. */
function smooth(pts: [number, number][]) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d;
}

/**
 * Sparkline de 26px: la v1 la dibujaba a 54px y ocupaba más superficie que la cifra.
 * Aquí es contexto, no protagonista — dice "va subiendo" sin pedir que se lea el eje.
 */
function Sparkline({ points, color, id }: { points: number[]; color: string; id: string }) {
    if (!points || points.length < 2) return null;
    const w = 200;
    const h = 26;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const pad = 3;
    const range = max - min || 1;
    const pts = points.map(
        (p, i) =>
            [
                (i * w) / (points.length - 1),
                h - pad - ((p - min) / range) * (h - pad * 2),
            ] as [number, number]
    );
    const d = smooth(pts);
    const area = `${d} L ${pts[pts.length - 1][0]},${h} L ${pts[0][0]},${h} Z`;

    return (
        <svg
            className="mt-2.5 block w-full h-[26px] pointer-events-none"
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity={0.16} />
                    <stop offset="1" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${id})`} />
            <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Celda({ item, index }: { item: StatItem; index: number }) {
    const tono = item.tone ?? 'neutral';
    const valor = item.format === 'currency' ? formatCurrency(item.value) : item.value.toLocaleString('es-PA');
    const TrendIcon = item.trend === 'up' ? TrendingUp : TrendingDown;

    // Los bordes se calculan por índice en vez de con `divide-x`: en una grilla que pasa
    // de 2 a 4 columnas, `divide-x` le pone borde izquierdo al primer ítem de cada fila.
    const bordes = cn(
        index % 2 !== 0 && 'border-l border-border',
        index >= 2 && 'border-t border-border',
        'lg:border-t-0',
        index !== 0 ? 'lg:border-l lg:border-border' : 'lg:border-l-0'
    );

    const contenido = (
        <div className={cn('px-4 py-3.5 h-full flex flex-col', bordes)}>
            <div className="flex items-center gap-1.5">
                <span aria-hidden="true" className={cn('size-[5px] rounded-[1px] shrink-0', dotTone[tono])} />
                <span className="label-caps truncate">{item.label}</span>
            </div>

            <div className="mt-1.5 font-mono tabular text-[22px] font-semibold leading-none tracking-tight text-foreground">
                {valor}
            </div>

            {item.change !== undefined && (
                <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                        className={cn(
                            'inline-flex items-center gap-0.5 font-mono tabular text-[11px] font-semibold',
                            item.trend === 'up' ? 'text-success' : 'text-danger'
                        )}
                    >
                        <TrendIcon className="size-3 shrink-0" />
                        {Math.abs(item.change)}%
                    </span>
                    <span className="text-[11px] text-muted-foreground">vs. anterior</span>
                </div>
            )}

            {item.sparkPoints && (
                <div className="mt-auto">
                    <Sparkline points={item.sparkPoints} color={strokeTone[tono]} id={item.sparkId} />
                </div>
            )}
        </div>
    );

    if (item.href) {
        return (
            <Link
                href={item.href}
                className="block h-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
                {contenido}
            </Link>
        );
    }

    return contenido;
}

export function StatStrip({ items, className }: { items: StatItem[]; className?: string }) {
    return (
        <div
            className={cn(
                'rounded-lg border border-border bg-card shadow-premium overflow-hidden',
                className
            )}
        >
            <div className="grid grid-cols-2 lg:grid-cols-4">
                {items.map((item, i) => (
                    <Celda key={item.sparkId} item={item} index={i} />
                ))}
            </div>
        </div>
    );
}

export default StatStrip;
