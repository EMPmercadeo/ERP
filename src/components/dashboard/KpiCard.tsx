import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
    title: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down';
    icon: React.ElementType;
    format?: 'currency' | 'number';
    href?: string;
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
    href
}: KpiCardProps & { variant?: 'default' | 'primary' }) {
    const formattedValue = format === 'currency' ? formatCurrency(value) : value.toLocaleString();
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

    const isPrimary = variant === 'primary';

    const cardStyles = isPrimary
        ? 'border-0 bg-gradient-to-r from-blue-600 to-teal-400 text-white shadow-md'
        : 'bg-white shadow-sm';

    const titleColor = isPrimary ? 'text-white/85' : 'text-muted-foreground';
    const iconColor = isPrimary ? 'text-white/85' : 'text-muted-foreground';

    const getTrendColor = () => {
        if (isPrimary) return 'text-white';
        return trend === 'up' ? 'text-emerald-500' : 'text-red-500';
    };

    const Content = (
        <Card
            className={cn(
                'flex min-h-30 flex-col justify-between gap-4 px-6 py-5',
                cardStyles,
                href && 'cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
                href && !isPrimary && 'hover:border-brand-1/30'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={cn('text-sm font-medium', titleColor)}>{title}</span>
                <Icon className={cn('size-[18px] shrink-0', iconColor)} />
            </div>
            <div>
                <div className="text-2xl font-bold leading-[1.1] tracking-tight">{formattedValue}</div>
                {change !== undefined && (
                    <div className={cn('mt-1.5 flex items-center gap-1 text-xs font-medium', getTrendColor())}>
                        <TrendIcon className="size-3.5" />
                        <span>{Math.abs(change)}% vs periodo anterior</span>
                    </div>
                )}
            </div>
        </Card>
    );

    if (href) {
        return <Link href={href}>{Content}</Link>;
    }

    return Content;
}
