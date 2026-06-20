'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        enviado = 0
    } = data;

    const total = aceptadas + pendientes + rechazadas + error + enviado;
    const errorTotal = rechazadas + error;

    // Data for chart
    const segments = [
        { label: 'Aceptadas', value: aceptadas, color: '#10B981' },
        { label: 'Pendientes', value: pendientes, color: '#F59E0B' },
        { label: 'Enviadas', value: enviado, color: '#3B82F6' },
        { label: 'Rechazadas', value: rechazadas + error, color: '#EF4444' }, // Combine captured rejected/anulada/error
    ].filter(s => s.value > 0);

    // Config
    const width = 450;
    const height = 250;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 70; // Smaller radius to fit labels
    const strokeWidth = 35;
    const labelRadius = radius + 35; // Distance for label start
    const lineRadius = radius + 25; // Where line starts

    let accumulatedAngle = 0; // Start at 0 (top if rotated -90 in logic, but standard math starts at 3 o'clock. We rotate -90 via transform)

    // To position labels correctly, we need absolute angles.
    // SVG standard: 0 is 3 o'clock.
    // We want 0 to be 12 o'clock, so we usually rotate -90.
    // However, for calculating label positions, it's easier to work with standard angles and just rotate the group or adjust calculations.
    // Let's use simple cumulative percentages converted to radians.

    // Total circumference logic for stroke-dasharray (CSS way) is good for animation, 
    // but for specific label placement, explicit paths/coords are more precise.
    // However, sticking to the existing stroke-dasharray approach is cleaner for the styling we have.
    // We just need to know the 'middle' angle of each segment to place the label.

    const circumference = 2 * Math.PI * radius;
    let accumulatedValue = 0;

    return (
        <Card className="h-full bg-white shadow-sm border-0">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground">
                    Estado DGI - Emisión de Documentos
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] flex items-center justify-center relative">
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                    <g transform={`translate(${centerX}, ${centerY})`}>
                        {segments.map((segment, i) => {
                            const percent = total > 0 ? segment.value / total : 0;
                            const segmentAngle = percent * 2 * Math.PI;

                            // Calculate stroke dash
                            const strokeLength = circumference * percent;
                            const dashArray = `${strokeLength} ${circumference}`;
                            // The start offset needs to match the accumulation
                            // CSS rotation of -90 means visual start is 12 o'clock.
                            // The `accumulatedValue` is the offset from the start.
                            const rot = -90; // base rotation

                            // For labels:
                            // The "center" of this segment is at accumulatedValue + half content
                            const midAngle = (accumulatedValue + segment.value / 2) / total * 2 * Math.PI;
                            // Convert to standard math angle (where 0 is 3 o'clock)
                            // Our visual 0 is -90deg (12 o'clock).
                            // So visual angle = midAngle_radians - PI/2
                            const visualAngle = midAngle - Math.PI / 2;

                            const lineX1 = Math.cos(visualAngle) * (radius + strokeWidth / 2);
                            const lineY1 = Math.sin(visualAngle) * (radius + strokeWidth / 2);

                            const lineX2 = Math.cos(visualAngle) * lineRadius;
                            const lineY2 = Math.sin(visualAngle) * lineRadius;

                            // Label position
                            const labelX = Math.cos(visualAngle) * labelRadius;
                            const labelY = Math.sin(visualAngle) * labelRadius;

                            // Text anchor logic
                            const isRightSide = Math.cos(visualAngle) >= 0;
                            const textAnchor = isRightSide ? 'start' : 'end';
                            const textX = isRightSide ? labelX + 10 : labelX - 10;

                            const percentText = `${(percent * 100).toFixed(0)}%`;

                            // Update accumulator for next segment's stroke-dashoffset
                            // Note: stroke-dashoffset usually works backwards or needs negative. 
                            // Using standard rotate for each segment or one cumulative offset?
                            // The previous implementation used one circle with dashoffset.
                            // Let's stick to simple circles rotated.

                            const circleComp = (
                                <circle
                                    key={`circle-${i}`}
                                    r={radius}
                                    fill="transparent"
                                    stroke={segment.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={dashArray}
                                    strokeDashoffset={0}
                                    transform={`rotate(${(accumulatedValue / total) * 360 - 90})`}
                                    className="transition-all duration-500"
                                />
                            );

                            const labelComp = (
                                <g key={`label-${i}`} className="pointer-events-none">
                                    <polyline
                                        points={`${lineX1},${lineY1} ${lineX2},${lineY2}`}
                                        fill="none"
                                        stroke={segment.color}
                                        strokeWidth="2"
                                        opacity="0.5"
                                    />
                                    <text
                                        x={textX}
                                        y={labelY}
                                        fill="#374151"
                                        textAnchor={textAnchor}
                                        dy="-0.2em"
                                        fontSize="12"
                                        fontWeight="600"
                                        className="fill-foreground"
                                    >
                                        {segment.label} {total > 0 && segment.value === 0 ? '' : ''}
                                    </text>
                                    <text
                                        x={textX}
                                        y={labelY}
                                        fill={segment.color}
                                        textAnchor={textAnchor}
                                        dy="1em"
                                        fontSize="14"
                                        fontWeight="bold"
                                    >
                                        {percentText}
                                    </text>
                                </g>
                            );

                            accumulatedValue += segment.value;

                            return (
                                <g key={i}>
                                    {circleComp}
                                    {labelComp}
                                </g>
                            )
                        })}
                        {/* Optional Center Text/Icon */}
                    </g>
                </svg>
            </CardContent>
        </Card>
    );
}
