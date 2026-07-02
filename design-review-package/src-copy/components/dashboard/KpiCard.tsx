import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface KpiCardProps {
    title: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down';
    icon: React.ElementType;
    format?: 'currency' | 'number';
    href?: string;
    variant?: 'default' | 'primary';
    chipClass?: string;
    sparkPoints?: number[];
    sparkColor?: string;
    sparkId?: string;
}

function smooth(pts: [number, number][]) {
    if (pts.length < 2) return "";
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

function Sparkline({ points, color, id }: { points: number[]; color: string; id: string }) {
    if (!points || points.length === 0) return null;
    const w = 200;
    const h = 54;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const pad = 6;
    const range = max - min || 1;
    const pts = points.map((p, i) => [
        pad + (i * (w - pad * 2)) / (points.length - 1),
        h - pad - ((p - min) / range) * (h - pad * 2)
    ] as [number, number]);
    const d = smooth(pts);
    const area = `${d} L ${pts[pts.length - 1][0]},${h} L ${pts[0][0]},${h} Z`;
    return (
        <svg className="absolute right-0 bottom-0 w-[56%] h-[54px] opacity-90 pointer-events-none" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity={0.28} />
                    <stop offset="1" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${id})`} />
            <path d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function KpiCard({
    title,
    value,
    change,
    trend,
    icon: Icon,
    format = 'number',
    variant = 'default',
    chipClass,
    sparkPoints,
    sparkColor = 'white',
    sparkId = 'spark',
    href
}: KpiCardProps) {
    const formattedValue = format === 'currency' ? formatCurrency(value) : value.toLocaleString();
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    const isPrimary = variant === 'primary';

    const cardStyles = isPrimary
        ? 'border-0 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-400 text-white shadow-md shadow-blue-500/20'
        : 'bg-white shadow-sm border-border hover:border-slate-300';

    const titleColor = isPrimary ? 'text-white/85' : 'text-muted-foreground';

    const Content = (
        <Card
            className={cn(
                'relative flex min-h-[158px] flex-col justify-between p-5 overflow-hidden transition-all duration-200',
                cardStyles,
                href && 'cursor-pointer hover:-translate-y-1 hover:shadow-md'
            )}
        >
            <div className="flex items-center justify-between gap-2 z-10">
                <span className={cn('text-[13px] font-semibold', titleColor)}>{title}</span>
                <div className={cn(
                    'w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    isPrimary ? 'bg-white/20 text-white' : chipClass || 'bg-secondary text-secondary-foreground'
                )}>
                    <Icon className="size-[19px] shrink-0" />
                </div>
            </div>
            
            <div className="z-10 mt-2">
                <div className="text-[26px] font-bold leading-none tracking-tight font-mono">
                    {formattedValue}
                </div>
            </div>

            {change !== undefined && (
                <div className="mt-auto pt-3.5 flex items-center gap-2 z-10">
                    <span className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full font-mono',
                        isPrimary
                            ? 'bg-white/22 text-white'
                            : trend === 'up'
                                ? 'bg-success-bg text-success'
                                : 'bg-danger-bg text-danger'
                    )}>
                        <TrendIcon className="size-3 stroke-[3]" />
                        {Math.abs(change)}%
                    </span>
                    <span className={cn('text-xs', isPrimary ? 'text-white/80' : 'text-muted-foreground')}>
                        vs. anterior
                    </span>
                </div>
            )}

            {sparkPoints && (
                <Sparkline points={sparkPoints} color={isPrimary ? 'white' : sparkColor} id={sparkId} />
            )}
        </Card>
    );

    if (href) {
        return <Link href={href} className="block">{Content}</Link>;
    }

    return Content;
}
