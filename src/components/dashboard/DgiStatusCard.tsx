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

export function DgiStatusCard({ data }: DgiStatusCardProps) {
    const {
        aceptadas,
        pendientes,
        rechazadas,
        error = 0,
        enviado = 0,
    } = data;

    const segments = [
        { label: 'Aceptada', value: aceptadas, color: 'var(--success)' },
        { label: 'Procesando', value: enviado, color: 'var(--info)' },
        { label: 'Pendiente', value: pendientes, color: 'var(--warning)' },
        { label: 'Rechazada', value: rechazadas + error, color: 'var(--danger)' },
    ].filter((segment) => segment.value > 0);

    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    const CX = 70;
    const CY = 70;
    const RADIUS = 54;
    const C = 2 * Math.PI * RADIUS;

    let accumulatedOffset = 0;

    return (
        <Card className="flex h-full flex-col bg-white shadow-premium border border-border rounded-2xl overflow-hidden transition-premium">
            <CardHeader className="border-b border-border/50 p-5">
                <CardTitle className="text-base font-semibold">Estado DGI</CardTitle>
                <CardDescription className="text-xs">Validación fiscal del periodo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between p-0">
                {total === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground py-12">
                        Sin documentos en este periodo
                    </div>
                ) : (
                    <>
                        {/* Donut Container */}
                        <div className="flex flex-col items-center justify-center px-4 py-2">
                            <div className="relative w-[140px] h-[140px]">
                                <svg
                                    width="140"
                                    height="140"
                                    viewBox="0 0 140 140"
                                    className="rotate-[-90deg] w-full h-full"
                                >
                                    {/* Background Circle Track */}
                                    <circle
                                        cx={CX}
                                        cy={CY}
                                        r={RADIUS}
                                        fill="none"
                                        stroke="var(--secondary)"
                                        strokeWidth={14}
                                    />
                                    {/* Segment Circles */}
                                    {segments.map((segment, i) => {
                                        const len = (segment.value / total) * C;
                                        // len - 2 creates rounded caps gaps like mockup
                                        const dash = Math.max(0.1, len - 2);
                                        const strokeDashArray = `${dash} ${C - dash}`;
                                        const strokeDashOffset = -accumulatedOffset;
                                        accumulatedOffset += len;

                                        return (
                                            <circle
                                                key={i}
                                                cx={CX}
                                                cy={CY}
                                                r={RADIUS}
                                                fill="none"
                                                stroke={segment.color}
                                                strokeWidth={14}
                                                strokeDasharray={strokeDashArray}
                                                strokeDashoffset={strokeDashOffset}
                                                strokeLinecap="round"
                                                className="transition-all duration-300"
                                            />
                                        );
                                    })}
                                </svg>
                                {/* Center Labels */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono text-[24px] font-bold leading-none tracking-tight text-foreground">
                                        {total}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-semibold mt-1">
                                        documentos
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Legend List */}
                        <div className="w-full flex flex-col gap-0.5 px-4 pb-5 mt-auto">
                            {segments.map((segment, i) => {
                                const percentage = Math.round((segment.value / total) * 100);
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 px-3 py-1.5 rounded-xl transition-colors hover:bg-slate-50 cursor-default"
                                    >
                                        <i
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: segment.color }}
                                        />
                                        <span className="text-[13.5px] font-semibold text-foreground">
                                            {segment.label}
                                        </span>
                                        <span className="ml-auto font-mono text-[13px] font-semibold text-muted-foreground/90">
                                            {segment.value}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground/60 w-10 text-right font-semibold">
                                            {percentage}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
