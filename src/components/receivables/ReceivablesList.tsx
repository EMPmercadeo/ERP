'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    RotateCcw,
    X,
    Calendar,
    DollarSign,
    Loader2,
    Plus,
    FileText,
    TrendingDown,
    AlertCircle,
    Check
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { recordInvoicePayment } from '@/lib/actions/invoices';
import { formatCurrency } from '@/lib/utils/currency';

export interface ReceivableInvoice {
    id: string;
    numeroCompleto: string;
    clientName: string;
    clientRuc: string;
    fechaEmision: string;
    fechaVencimiento?: string | null;
    totalNeto: number;
    saldoPendiente: number;
    estadoDgi: string;
}

const getInitials = (name: string) => {
    return name
        .split(' ')
        .filter((w) => w[0] && /[a-zA-ZÁÉÍÓÚáéíóúÑñ]/.test(w[0]))
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
};

const palette = [
    'from-indigo-600 to-purple-400 text-white',
    'from-blue-600 to-cyan-400 text-white',
    'from-amber-500 to-orange-400 text-white',
    'from-rose-500 to-red-400 text-white',
    'from-emerald-500 to-teal-400 text-white'
];

export function ReceivablesList({
    initialData,
    pageCount,
    currentPage,
    pageSize,
    totalCount,
    initialSearch,
    initialSortBy,
    initialSortOrder
}: {
    initialData: ReceivableInvoice[];
    pageCount: number;
    currentPage: number;
    pageSize: number;
    totalCount: number;
    initialSearch: string;
    initialSortBy: string;
    initialSortOrder: 'asc' | 'desc';
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Active local filter states
    const [globalFilter, setGlobalFilter] = useState(initialSearch);
    const [sortBy, setSortBy] = useState(initialSortBy);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

    // Modal state for recording a payment
    const [activeInvoice, setActiveInvoice] = useState<ReceivableInvoice | null>(null);
    const [montoPago, setMontoPago] = useState<string>('');
    const [metodoPago, setMetodoPago] = useState<string>('efectivo');
    const [referencia, setReferencia] = useState<string>('');
    const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);

    const createQueryString = (params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(params)) {
            if (value === null) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        }
        return newParams.toString();
    };

    // Debounce search update to URL
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = searchParams.get('search') || '';
            if (globalFilter !== currentSearch) {
                const query = createQueryString({ search: globalFilter || null, page: '1' });
                router.push(`${pathname}?${query}`);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [globalFilter]);

    // Update state when activeInvoice is selected
    useEffect(() => {
        if (activeInvoice) {
            setMontoPago(activeInvoice.saldoPendiente.toFixed(2));
            setMetodoPago('efectivo');
            setReferencia('');
        }
    }, [activeInvoice]);

    const handleSort = (field: string) => {
        const nextOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(nextOrder);
        const query = createQueryString({ sortBy: field, sortOrder: nextOrder, page: '1' });
        router.push(`${pathname}?${query}`);
    };

    const handleResetFilters = () => {
        setGlobalFilter('');
        router.push(pathname);
    };

    const handleSavePayment = async () => {
        if (!activeInvoice) return;
        const monto = parseFloat(montoPago);
        if (isNaN(monto) || monto <= 0) {
            toast.error('Por favor, ingresa un monto válido mayor a 0.');
            return;
        }

        if (monto > activeInvoice.saldoPendiente) {
            toast.error(`El monto del pago ($${monto.toFixed(2)}) no puede ser mayor que el saldo pendiente ($${activeInvoice.saldoPendiente.toFixed(2)}).`);
            return;
        }

        setIsSavingPayment(true);
        try {
            const res = await recordInvoicePayment(activeInvoice.id, monto, metodoPago, referencia);
            if (res.success) {
                toast.success(res.message || 'Pago registrado exitosamente.');
                setActiveInvoice(null);
                router.refresh();
            } else {
                toast.error(res.error || 'Error al registrar el pago.');
            }
        } catch (error) {
            toast.error('Error de red al intentar registrar el pago.');
        } finally {
            setIsSavingPayment(false);
        }
    };

    // Check if invoice is overdue
    const isInvoiceOverdue = (fechaVencimientoStr?: string | null) => {
        if (!fechaVencimientoStr) return false;
        const due = new Date(fechaVencimientoStr);
        const now = new Date();
        due.setHours(23, 59, 59, 999); // End of due day
        return now > due;
    };

    // Calculate sum metrics for header overview card
    const metrics = useMemo(() => {
        return initialData.reduce((acc, curr) => {
            acc.total += curr.saldoPendiente;
            if (isInvoiceOverdue(curr.fechaVencimiento)) {
                acc.vencido += curr.saldoPendiente;
            } else {
                acc.alDia += curr.saldoPendiente;
            }
            return acc;
        }, { total: 0, vencido: 0, alDia: 0 });
    }, [initialData]);

    return (
        <ContentContainer>
            <div className="space-y-4 font-sans">
                {/* Header Title */}
                <div className="py-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800">Cuentas por Cobrar</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Administra facturas de crédito y registra pagos parciales o totales de tus clientes
                    </p>
                </div>

                {/* Metrics Cards Overview */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-white border-slate-100 shadow-sm rounded-xl">
                        <CardContent className="p-3.5 flex flex-col justify-between h-full">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Por Cobrar</span>
                            <span className="text-sm sm:text-base font-extrabold text-slate-800 mt-2 font-mono tabular-nums leading-none">
                                {formatCurrency(metrics.total)}
                            </span>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-100 shadow-sm rounded-xl">
                        <CardContent className="p-3.5 flex flex-col justify-between h-full">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider leading-none">Saldo Al Día</span>
                            <span className="text-sm sm:text-base font-extrabold text-emerald-600 mt-2 font-mono tabular-nums leading-none">
                                {formatCurrency(metrics.alDia)}
                            </span>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-100 shadow-sm rounded-xl">
                        <CardContent className="p-3.5 flex flex-col justify-between h-full">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider leading-none">Saldo Vencido</span>
                            <span className="text-sm sm:text-base font-extrabold text-rose-600 mt-2 font-mono tabular-nums leading-none">
                                {formatCurrency(metrics.vencido)}
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter / Search Bar */}
                <Card className="bg-white shadow-sm border border-slate-100 rounded-xl overflow-visible">
                    <CardContent className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por número, cliente o RUC..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="h-10 pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full text-xs sm:text-sm"
                            />
                            {globalFilter && (
                                <button
                                    type="button"
                                    onClick={() => setGlobalFilter('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Desktop and Mobile list view */}
                <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto min-h-[300px]">
                            <Table className="border-b border-slate-100">
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-10 font-bold text-slate-700 text-xs">
                                            <Button variant="ghost" onClick={() => handleSort('numeroCompleto')} className="-ml-3 h-8 font-bold text-slate-700 hover:bg-transparent">
                                                Documento
                                                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="h-10 font-bold text-slate-700 text-xs">Cliente</TableHead>
                                        <TableHead className="h-10 font-bold text-slate-700 text-xs">
                                            <Button variant="ghost" onClick={() => handleSort('fechaEmision')} className="-ml-3 h-8 font-bold text-slate-700 hover:bg-transparent">
                                                Emisión
                                                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="h-10 font-bold text-slate-700 text-xs">Vencimiento</TableHead>
                                        <TableHead className="h-10 font-bold text-slate-700 text-xs text-right">Total Neto</TableHead>
                                        <TableHead className="h-10 font-bold text-slate-700 text-xs text-right">Saldo Pendiente</TableHead>
                                        <TableHead className="h-10 font-bold text-slate-700 text-xs text-center">Estado</TableHead>
                                        <TableHead className="h-10 w-24"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialData.length > 0 ? (
                                        initialData.map((invoice) => {
                                            const overdue = isInvoiceOverdue(invoice.fechaVencimiento);
                                            return (
                                                <TableRow key={invoice.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
                                                    <TableCell className="py-3 font-mono text-xs font-bold text-brand-1">{invoice.numeroCompleto}</TableCell>
                                                    <TableCell className="py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800 text-xs">{invoice.clientName}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">RUC: {invoice.clientRuc}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-600">
                                                        {new Date(invoice.fechaEmision).toLocaleDateString('es-PA')}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-600">
                                                        {invoice.fechaVencimiento ? new Date(invoice.fechaVencimiento).toLocaleDateString('es-PA') : '—'}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right font-mono text-xs font-semibold text-slate-700">
                                                        {formatCurrency(invoice.totalNeto)}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                                                        {formatCurrency(invoice.saldoPendiente)}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <Badge className={overdue ? "bg-rose-50 text-rose-600 border-transparent hover:bg-rose-50 text-[10px] font-bold px-2 py-0.5 rounded" : "bg-emerald-50 text-emerald-600 border-transparent hover:bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded"}>
                                                            {overdue ? 'Vencida' : 'Al Día'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right pr-4">
                                                        <Button
                                                            size="sm"
                                                            className="h-8 font-bold text-xs bg-brand-1 hover:bg-brand-2 text-white rounded-lg shadow-sm"
                                                            onClick={() => setActiveInvoice(invoice)}
                                                        >
                                                            Cobrar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-64">
                                                <EmptyState
                                                    icon={TrendingDown}
                                                    title="No hay cuentas pendientes"
                                                    description={globalFilter ? "Ninguna factura por cobrar coincide con la búsqueda." : "¡Excelente! No tienes cuentas vencidas o pendientes por cobrar actualmente."}
                                                    action={globalFilter ? (
                                                        <Button onClick={handleResetFilters} variant="outline" className="h-9 font-semibold text-xs border-slate-200 gap-1.5">
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                            Restablecer Filtro
                                                        </Button>
                                                    ) : undefined}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile List View */}
                        <div className="block md:hidden p-4 space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto min-h-[300px] border-b">
                            {initialData.length > 0 ? (
                                initialData.map((invoice, index) => {
                                    const overdue = isInvoiceOverdue(invoice.fechaVencimiento);
                                    const initials = getInitials(invoice.clientName) || 'CL';
                                    const gradClass = palette[index % palette.length];
                                    
                                    return (
                                        <div 
                                            key={invoice.id}
                                            className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-3.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer relative"
                                            onClick={() => setActiveInvoice(invoice)}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br ${gradClass} shrink-0 select-none`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-800 text-xs truncate max-w-[170px]">{invoice.clientName}</h4>
                                                        <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">{invoice.numeroCompleto}</p>
                                                    </div>
                                                </div>
                                                <Badge className={overdue ? "bg-rose-50 text-rose-600 border-transparent hover:bg-rose-50 text-[9px] font-bold px-2 py-0.5 rounded" : "bg-emerald-50 text-emerald-600 border-transparent hover:bg-emerald-50 text-[9px] font-bold px-2 py-0.5 rounded"}>
                                                    {overdue ? 'Vencida' : 'Al Día'}
                                                </Badge>
                                            </div>

                                            <div className="flex justify-between items-baseline border-t border-slate-100/60 pt-2.5">
                                                <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
                                                    <span>Total: {formatCurrency(invoice.totalNeto)}</span>
                                                    <span>Emisión: {new Date(invoice.fechaEmision).toLocaleDateString('es-PA')}</span>
                                                    {invoice.fechaVencimiento && (
                                                        <span className={overdue ? "text-rose-600 font-medium" : ""}>
                                                            Vence: {new Date(invoice.fechaVencimiento).toLocaleDateString('es-PA')}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="text-right flex flex-col">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Saldo Pendiente</span>
                                                    <span className="font-mono font-extrabold text-sm text-slate-800 mt-1">{formatCurrency(invoice.saldoPendiente)}</span>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-100/60 pt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    size="sm"
                                                    className="w-full h-10 font-bold text-xs bg-brand-1 hover:bg-brand-2 text-white rounded-lg shadow-sm"
                                                    onClick={() => setActiveInvoice(invoice)}
                                                >
                                                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                                                    Registrar Cobro
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                                    No hay cuentas pendientes
                                </div>
                            )}
                        </div>

                        {/* Pagination (Backend Powered) */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/30">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500">
                                <span>
                                    Mostrando {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
                                    {Math.min(currentPage * pageSize, totalCount)} de {totalCount} facturas
                                </span>
                                <span className="hidden sm:inline text-slate-200">|</span>
                                <span className="font-semibold text-slate-700">
                                    Página {currentPage} de {pageCount || 1}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="hidden sm:inline">Filas por página:</span>
                                    <Select
                                        value={String(pageSize)}
                                        onValueChange={(val) => {
                                            const query = createQueryString({ limit: val, page: '1' });
                                            router.push(`${pathname}?${query}`);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[65px] text-xs rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="10" className="text-xs cursor-pointer">10</SelectItem>
                                            <SelectItem value="20" className="text-xs cursor-pointer">20</SelectItem>
                                            <SelectItem value="50" className="text-xs cursor-pointer">50</SelectItem>
                                            <SelectItem value="100" className="text-xs cursor-pointer">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const query = createQueryString({ page: String(currentPage - 1) });
                                            router.push(`${pathname}?${query}`);
                                        }}
                                        disabled={currentPage <= 1}
                                        className="h-8 text-xs font-semibold px-3 border-slate-200 rounded-lg"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const query = createQueryString({ page: String(currentPage + 1) });
                                            router.push(`${pathname}?${query}`);
                                        }}
                                        disabled={currentPage >= pageCount}
                                        className="h-8 text-xs font-semibold px-3 border-slate-200 rounded-lg"
                                    >
                                        Siguiente
                                        <ChevronRight className="h-3.5 w-3.5 ml-1 text-slate-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Registrar Cobro Modal */}
            {activeInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setActiveInvoice(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            disabled={isSavingPayment}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Cobro</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Registrar un abono o liquidación para esta cuenta por cobrar.
                                </p>
                            </div>

                            {/* Short Invoice Summary */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Cliente:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{activeInvoice.clientName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Factura:</span>
                                    <span className="font-mono font-bold text-brand-1 dark:text-blue-400">{activeInvoice.numeroCompleto}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800 pt-2 mt-1">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">Saldo Pendiente:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">{formatCurrency(activeInvoice.saldoPendiente)}</span>
                                </div>
                            </div>

                            {/* Form fields */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="montoPago" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Monto a Recibir (USD)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                                        <Input
                                            id="montoPago"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={activeInvoice.saldoPendiente}
                                            value={montoPago}
                                            onChange={(e) => setMontoPago(e.target.value)}
                                            className="h-11 pl-7 font-mono font-bold text-slate-800 dark:text-white bg-slate-50/50 dark:bg-slate-900 border-slate-200 focus-visible:ring-brand-1 rounded-xl text-sm"
                                            disabled={isSavingPayment}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 block">
                                        Ingresa el monto del abono o haz clic para liquidar el saldo total.
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="metodoPago" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Método de Pago
                                    </label>
                                    <Select 
                                        value={metodoPago} 
                                        onValueChange={setMetodoPago}
                                        disabled={isSavingPayment}
                                    >
                                        <SelectTrigger id="metodoPago" className="h-11 rounded-xl bg-slate-50/50 border-slate-200 w-full text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="efectivo" className="text-sm cursor-pointer">Efectivo</SelectItem>
                                            <SelectItem value="tarjeta" className="text-sm cursor-pointer">Tarjeta de Crédito/Débito</SelectItem>
                                            <SelectItem value="yappy" className="text-sm cursor-pointer">Yappy / ACH</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="referenciaPago" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Referencia / No. de Transacción (Opcional)
                                    </label>
                                    <Input
                                        id="referenciaPago"
                                        placeholder="Ej. Yappy Ref: 123456"
                                        value={referencia}
                                        onChange={(e) => setReferencia(e.target.value)}
                                        className="h-11 bg-slate-50/50 dark:bg-slate-900 border-slate-200 focus-visible:ring-brand-1 rounded-xl text-sm"
                                        disabled={isSavingPayment}
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2 pt-2">
                                <Button
                                    onClick={handleSavePayment}
                                    disabled={isSavingPayment}
                                    className="w-full h-11 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs rounded-xl shadow-sm"
                                >
                                    {isSavingPayment ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Registrando Cobro...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Confirmar Cobro
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-11 rounded-xl font-bold text-xs"
                                    onClick={() => setActiveInvoice(null)}
                                    disabled={isSavingPayment}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ContentContainer>
    );
}
