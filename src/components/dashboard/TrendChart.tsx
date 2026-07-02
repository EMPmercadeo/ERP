'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';

interface TrendPoint {
    mes: string;
    facturado: number;
    cobrado: number;
}

interface TrendChartProps {
    data: TrendPoint[];
}

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



export function TrendChart({ data }: TrendChartProps) {
    const [hoveredPoint, setHoveredPoint] = useState<{
        index: number;
        x: number;
        y: number;
        mes: string;
        facturado: number;
        cobrado: number;
    } | null>(null);

    if (!data || data.length === 0) {
        return (
            <Card className="flex h-full flex-col bg-white shadow-sm border-border">
                <CardContent className="flex flex-1 items-center justify-center text-muted-foreground text-sm py-10">
                    No hay datos de tendencia disponibles
                </CardContent>
            </Card>
        );
    }

    const W = 760;
    const H = 280;
    const L = 52;
    const R = 18;
    const T = 24;
    const B = 42;
    const iw = W - L - R;
    const ih = H - T - B;

    const maxVal = Math.max(...data.map((d) => Math.max(d.facturado, d.cobrado)));
    const max = Math.ceil(maxVal / 10000) * 10000 || 10000;

    const getX = (i: number) => L + (i * iw) / (data.length - 1);
    const getY = (v: number) => T + ih - (v / max) * ih;

    const factPoints = data.map((d, i) => [getX(i), getY(d.facturado)] as [number, number]);
    const cobrPoints = data.map((d, i) => [getX(i), getY(d.cobrado)] as [number, number]);

    const dF = smooth(factPoints);
    const dC = smooth(cobrPoints);
    const areaF = factPoints.length > 0 ? `${dF} L ${factPoints[factPoints.length - 1][0]},${T + ih} L ${factPoints[0][0]},${T + ih} Z` : '';

    // Horizontal grid lines and Y-axis labels
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
        const gy = T + (ih * i) / 4;
        const val = max - (max / 4) * i;
        gridLines.push({
            y: gy,
            label: `${(val / 1000).toFixed(0)}k`,
        });
    }

    return (
        <Card className="flex h-full flex-col bg-white shadow-sm border-border">
            <div className="flex flex-row items-center justify-between border-b p-5">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">Tendencia de Ventas</h3>
                    <p className="text-xs text-muted-foreground">Facturado vs. cobrado · últimos 6 meses</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <i className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, var(--info), var(--info-light))' }} />
                        Facturado
                    </span>
                    <span className="flex items-center gap-1.5">
                        <i className="w-3 h-3 rounded-full" style={{ background: 'var(--success)' }} />
                        Cobrado
                    </span>
                </div>
            </div>
            <CardContent className="flex-1 p-5 relative min-h-[220px]">
                <div className="relative w-full h-full">
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full h-full min-h-[180px]"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="var(--info)" stopOpacity={0.24} />
                                <stop offset="1" stopColor="var(--info)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gline" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0" stopColor="var(--info)" />
                                <stop offset="1" stopColor="var(--info-light)" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines and values */}
                        {gridLines.map((gl, i) => (
                            <g key={i}>
                                <line x1={L} y1={gl.y} x2={W - R} y2={gl.y} stroke="var(--border)" strokeWidth={1} />
                                <text
                                    x={L - 12}
                                    y={gl.y + 4}
                                    textAnchor="end"
                                    fontSize={11}
                                    fill="var(--muted-foreground)"
                                    fontFamily="var(--font-mono)"
                                    className="font-mono font-medium"
                                >
                                    {gl.label}
                                </text>
                            </g>
                        ))}

                        {/* X Axis Labels */}
                        {data.map((d, i) => (
                            <text
                                key={i}
                                x={getX(i)}
                                y={H - 14}
                                textAnchor="middle"
                                fontSize={12}
                                fill="var(--muted-foreground)"
                                fontWeight={500}
                            >
                                {d.mes}
                            </text>
                        ))}

                        {/* Area */}
                        {areaF && <path d={areaF} fill="url(#gF)" />}

                        {/* Cobrado line (Dashed) */}
                        {dC && (
                            <path
                                d={dC}
                                fill="none"
                                stroke="var(--success)"
                                strokeWidth={2.6}
                                strokeDasharray="5 5"
                                strokeLinecap="round"
                            />
                        )}

                        {/* Facturado line (Solid Gradient) */}
                        {dF && (
                            <path
                                d={dF}
                                fill="none"
                                stroke="url(#gline)"
                                strokeWidth={3.2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Point Circles */}
                        {data.map((d, i) => (
                            <g key={i}>
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.cobrado)}
                                    r={4}
                                    fill="white"
                                    stroke="var(--success)"
                                    strokeWidth={2.5}
                                />
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.facturado)}
                                    r={4.5}
                                    fill="white"
                                    stroke="var(--info)"
                                    strokeWidth={2.5}
                                />
                            </g>
                        ))}

                        {/* Interactive hover zones */}
                        {data.map((d, i) => (
                            <rect
                                key={i}
                                x={getX(i) - iw / data.length / 2}
                                y={T}
                                width={iw / data.length}
                                height={ih}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => {
                                    setHoveredPoint({
                                        index: i,
                                        x: (getX(i) / W) * 100,
                                        y: (getY(d.facturado) / H) * 100,
                                        mes: d.mes,
                                        facturado: d.facturado,
                                        cobrado: d.cobrado,
                                    });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredPoint && (
                        <div
                            className="absolute pointer-events-none bg-slate-950 text-white rounded-lg px-3 py-2 text-xs shadow-xl border border-slate-800 z-30 transition-all duration-150"
                            style={{
                                left: `${hoveredPoint.x}%`,
                                top: `calc(${hoveredPoint.y}% - 18px)`,
                                transform: 'translate(-50%, -100%)',
                            }}
                        >
                            <div className="font-bold border-b border-slate-800 pb-1 mb-1.5 text-slate-300">
                                {hoveredPoint.mes} 2026
                            </div>
                            <div className="flex items-center gap-3 mb-1 text-slate-100">
                                <span className="flex items-center gap-1.5">
                                    <i className="w-2 h-2 rounded-full" style={{ background: 'var(--info)' }} />
                                    Facturado:
                                </span>
                                <span className="font-mono font-semibold ml-auto">
                                    {formatCurrency(hoveredPoint.facturado)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-100">
                                <span className="flex items-center gap-1.5">
                                    <i className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                                    Cobrado:
                                </span>
                                <span className="font-mono font-semibold ml-auto">
                                    {formatCurrency(hoveredPoint.cobrado)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
