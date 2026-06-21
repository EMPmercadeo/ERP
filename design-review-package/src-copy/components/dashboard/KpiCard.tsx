

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    // Base styles
    const isPrimary = variant === 'primary';

    // Dynamic styles based on variant
    const cardStyles = isPrimary
        ? "flex flex-col justify-between bg-gradient-to-r from-blue-600 to-teal-400 text-white shadow-md border-0"
        : "flex flex-col justify-between bg-white shadow-sm";

    const titleColor = isPrimary ? "text-white/80" : "text-muted-foreground";
    const iconColor = isPrimary ? "text-white/80" : "text-muted-foreground";

    // Trend color logic
    const getTrendColor = () => {
        if (isPrimary) return "text-white";
        return trend === 'up' ? 'text-emerald-500' : 'text-red-500';
    };

    const Content = (
        <Card className={cn(cardStyles, href && "hover:scale-[1.02] transition-transform cursor-pointer")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={`text-sm font-medium ${titleColor}`}>
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue}</div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs ${getTrendColor()} mt-1`}>
                        <TrendIcon className="h-3 w-3" />
                        <span>{Math.abs(change)}% vs mes anterior</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{Content}</Link>;
    }

    return Content;
}
