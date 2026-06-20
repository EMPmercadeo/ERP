'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogHeader,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Period = '24h' | '7d' | '28d' | '3m' | '6m' | '12m' | '16m' | 'custom';

interface TimeFilterProps {
    className?: string;
}

export function TimeFilter({ className }: TimeFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initial state from URL
    const currentPeriod = (searchParams.get('period') as Period) || '3m';
    const currentStart = searchParams.get('start') ? new Date(searchParams.get('start')!) : undefined;
    const currentEnd = searchParams.get('end') ? new Date(searchParams.get('end')!) : undefined;

    const [open, setOpen] = React.useState(false);
    const [tempPeriod, setTempPeriod] = React.useState<Period>(currentPeriod);
    const [tempStart, setTempStart] = React.useState<Date | undefined>(currentStart);
    const [tempEnd, setTempEnd] = React.useState<Date | undefined>(currentEnd);

    // Internal state updates when dialog opens
    React.useEffect(() => {
        if (open) {
            setTempPeriod(currentPeriod);
            setTempStart(currentStart);
            setTempEnd(currentEnd);
        }
    }, [open, currentPeriod, currentStart, currentEnd]);

    const [tab, setTab] = React.useState('filter');

    const quickOptions: { label: string; value: Period }[] = [
        { label: '24 horas', value: '24h' },
        { label: '7 días', value: '7d' },
        { label: '28 días', value: '28d' },
        { label: '3 meses', value: '3m' },
    ];

    const extendedOptions: { label: string; value: Period }[] = [
        { label: 'Últimos 6 meses', value: '6m' },
        { label: 'Últimos 12 meses', value: '12m' },
        { label: 'Últimos 16 meses', value: '16m' },
    ];

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', tempPeriod);

        if (tempPeriod === 'custom') {
            if (tempStart) params.set('start', format(tempStart, 'yyyy-MM-dd'));
            if (tempEnd) params.set('end', format(tempEnd, 'yyyy-MM-dd'));
        } else {
            params.delete('start');
            params.delete('end');
        }

        if (tab === 'compare') {
            params.set('compare', 'true');
        } else {
            params.delete('compare');
        }

        const newUrl = `/dashboard?${params.toString()}`;
        console.log('Applying filter:', newUrl);
        router.push(newUrl);
        router.refresh(); // Force server re-fetch
        setOpen(false);
    };

    const handleInlineSelect = (val: Period) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', val);
        params.delete('start');
        params.delete('end');

        const newUrl = `/dashboard?${params.toString()}`;
        console.log('Inline selecting filter:', newUrl);
        router.push(newUrl);
        router.refresh(); // Force server re-fetch
    };

    return (
        <div className={cn("inline-flex h-9 items-center justify-center rounded-lg border bg-background p-0", className)}>
            {/* Quick Actions */}
            {quickOptions.map((option) => {
                const isSelected = currentPeriod === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => handleInlineSelect(option.value)}
                        className={cn(
                            "inline-flex h-full items-center justify-center whitespace-nowrap px-4 text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                            isSelected
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100/70"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            "border-r"
                        )}
                    >
                        {isSelected && <Check className="mr-2 h-3.5 w-3.5" />}
                        {option.label}
                    </button>
                );
            })}

            {/* Advanced Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <button
                        className={cn(
                            "inline-flex h-full items-center justify-center whitespace-nowrap px-4 text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                            !quickOptions.some(o => o.value === currentPeriod)
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100/70"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            "border-l"
                        )}
                    >
                        {(() => {
                            const isQuick = quickOptions.some(o => o.value === currentPeriod);
                            if (isQuick) return "Más información";
                            if (currentPeriod === 'custom') return "Personalizado";
                            return extendedOptions.find(o => o.value === currentPeriod)?.label || "Más información";
                        })()}
                        <ChevronDown className={cn("ml-2 h-4 w-4", !quickOptions.some(o => o.value === currentPeriod) ? "text-blue-700" : "opacity-50")} />
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-2 border-b">
                        <DialogTitle>Intervalo de fechas</DialogTitle>
                    </DialogHeader>

                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsList className="px-4 w-full justify-start border-b rounded-none h-12 bg-muted/10">
                            <TabsTrigger value="filter" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-3 pt-2 mr-6">
                                Filtrar
                            </TabsTrigger>
                            <TabsTrigger value="compare" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-3 pt-2">
                                Comparar
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6 bg-card">
                            <TabsContent value="filter" className="mt-0">
                                <RadioGroup
                                    value={tempPeriod}
                                    onValueChange={(v) => setTempPeriod(v as Period)}
                                    className="gap-4"
                                >
                                    <div className="flex flex-col gap-3">
                                        {[...quickOptions, ...extendedOptions].slice(4).map((opt) => (
                                            <div key={opt.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={opt.value} id={`r-${opt.value}`} />
                                                <Label htmlFor={`r-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                                            </div>
                                        ))}

                                        {/* Personalizado Section */}
                                        <div className="flex flex-col space-y-3 pt-1">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="custom" id="r-custom" />
                                                <Label htmlFor="r-custom" className="font-normal cursor-pointer">Personalizado</Label>
                                            </div>

                                            {/* Always render inputs, but potentially visibly distinct if selected */}
                                            {tempPeriod === 'custom' && (
                                                <div className="pl-6 grid gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center gap-2">
                                                        <div className="grid gap-1.5 flex-1">
                                                            <Label className="text-xs text-muted-foreground">Fecha de inicio</Label>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9", !tempStart && "text-muted-foreground")}>
                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                        {tempStart ? format(tempStart, 'yyyy-MM-dd') : <span>Inicio</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar mode="single" selected={tempStart} onSelect={setTempStart} initialFocus />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        <span className="text-muted-foreground pt-5">-</span>
                                                        <div className="grid gap-1.5 flex-1">
                                                            <Label className="text-xs text-muted-foreground">Fecha de finalización</Label>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9", !tempEnd && "text-muted-foreground")}>
                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                        {tempEnd ? format(tempEnd, 'yyyy-MM-dd') : <span>Fin</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar mode="single" selected={tempEnd} onSelect={setTempEnd} initialFocus />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </RadioGroup>
                            </TabsContent>

                            <TabsContent value="compare" className="mt-0">
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                                    <div className="rounded-full bg-muted p-3">
                                        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground text-sm max-w-[200px]">
                                        La función de comparar periodos estará disponible próximamente.
                                    </p>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <DialogFooter className="p-4 border-t bg-muted/10 sm:justify-end gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleApply}>Aplicar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
