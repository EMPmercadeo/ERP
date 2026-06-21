'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DgiStatusData {
    aceptadas: number;
    pendientes: number;
    rechazadas: number;
    error?: number;
    enviado?: number;
}

interface DgiStatusCardProps {
    data: DgiStatusData;
}

const RADIUS = 58;
const STROKE_WIDTH = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DgiStatusCard({ data }: DgiStatusCardProps) {
    const {
        aceptadas,
        pendientes,
        rechazadas,
        error = 0,
        enviado = 0,
    } = data;

    const segments = [
        { label: 'Aceptadas', value: aceptadas, color: '#10B981' },
        { label: 'Pendientes', value: pendientes, color: '#F59E0B' },
        { label: 'Enviadas', value: enviado, color: '#3B82F6' },
        { label: 'Rechazadas', value: rechazadas + error, color: '#DC2626' },
    ].filter((segment) => segment.value > 0);

    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    let accumulated = 0;

    return (
        <Card className="flex h-full flex-col bg-white shadow-sm">
            <CardHeader className="border-b">
                <CardTitle className="text-base font-semibold">Estado DGI</CardTitle>
                <CardDescription className="text-xs">Emisión de documentos · periodo actual</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center gap-5 py-6">
                {total === 0 ? (
                    <div className="flex h-full w-full items-center justify-center text-center text-sm text-muted-foreground">
                        Sin documentos en este periodo
                    </div>
                ) : (
                    <>
                        <svg viewBox="0 0 160 160" width="148" height="148" className="shrink-0">
                            <g transform="rotate(-90 80 80)">
                                {segments.map((segment) => {
                                    const fraction = segment.value / total;
                                    const dash = CIRCUMFERENCE * fraction;
                                    const offset = accumulated;
                                    accumulated += dash;
                                    return (
                                        <circle
                                            key={segment.label}
                                            cx="80"
                                            cy="80"
                                            r={RADIUS}
                                            fill="none"
                                            stroke={segment.color}
                                            strokeWidth={STROKE_WIDTH}
                                            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                                            strokeDashoffset={-offset}
                                            className="transition-all duration-500"
                                        />
                                    );
                                })}
                            </g>
                            <text
                                x="80"
                                y="76"
                                textAnchor="middle"
                                fontSize="26"
                                fontWeight="700"
                                className="fill-foreground"
                            >
                                {total}
                            </text>
                            <text x="80" y="96" textAnchor="middle" fontSize="11" className="fill-muted-foreground">
                                documentos
                            </text>
                        </svg>
                        <ul className="flex flex-1 flex-col gap-2.5">
                            {segments.map((segment) => (
                                <li key={segment.label} className="flex items-center gap-2 text-sm">
                                    <span
                                        className="size-2.5 shrink-0 rounded-[3px]"
                                        style={{ background: segment.color }}
                                    />
                                    <span className="text-muted-foreground">{segment.label}</span>
                                    <span className="ml-auto font-mono text-xs font-semibold tabular-nums text-foreground">
                                        {segment.value}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
