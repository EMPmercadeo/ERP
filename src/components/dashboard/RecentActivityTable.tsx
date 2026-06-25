'use client';

import { useState } from 'react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Eye,
    FileText,
    Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge, type DgiStatus } from '@/components/ui/status-badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface Invoice {
    id: string;
    client: string;
    clientRuc?: string;
    amount: number;
    balance: number;
    status: DgiStatus;
    paymentStatus: 'pagada' | 'pendiente' | 'parcial' | 'vencida';
    date: string;
}

interface RecentActivityTableProps {
    invoices: Invoice[];
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'CF';
    return name
        .split(' ')
        .filter((w) => w[0] && /[a-zA-ZÁÉÍÓÚáéíóúÑñ]/.test(w[0]))
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
};

const palette = [
    'from-blue-600 to-teal-400 text-white',
    'from-emerald-500 to-teal-400 text-white',
    'from-amber-500 to-orange-400 text-white',
    'from-indigo-500 to-purple-400 text-white',
    'from-rose-500 to-red-400 text-white',
    'from-blue-500 to-indigo-400 text-white'
];

const ITEMS_PER_PAGE = 5;
const HEAD_CLASS = 'h-auto bg-surface-light px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground';
const CELL_CLASS = 'px-4 py-3.5 align-middle';

export function RecentActivityTable({ invoices }: RecentActivityTableProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentInvoices = invoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage((p) => p - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
    };

    return (
        <Card className="flex h-full flex-col bg-white shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between border-b p-5">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Facturas Recientes</CardTitle>
                    <CardDescription className="text-xs">
                        Mostrando {invoices.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + ITEMS_PER_PAGE, invoices.length)} de {invoices.length} facturas
                    </CardDescription>
                </div>
                <Link href="/invoices">
                    <Button variant="ghost" size="sm" className="gap-1 text-brand-1 hover:text-brand-1/80 font-semibold">
                        Ver todas
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin">
                {/* Desktop View Table */}
                <div className="hidden md:block">
                    <Table className="min-w-[850px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={HEAD_CLASS}>Documento</TableHead>
                                <TableHead className={HEAD_CLASS}>Cliente</TableHead>
                                <TableHead className={HEAD_CLASS}>Emisión</TableHead>
                                <TableHead className={`${HEAD_CLASS} text-right`}>Monto</TableHead>
                                <TableHead className={`${HEAD_CLASS} text-right`}>Saldo</TableHead>
                                <TableHead className={HEAD_CLASS}>DGI</TableHead>
                                <TableHead className={HEAD_CLASS}>Pago</TableHead>
                                <TableHead className={`${HEAD_CLASS} w-px`} />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentInvoices.map((invoice, index) => {
                                const gradClass = palette[(startIndex + index) % palette.length];
                                const initials = getInitials(invoice.client) || 'CF';

                                return (
                                    <TableRow key={invoice.id} className="group hover:bg-slate-50/70 border-b">
                                        <TableCell className={CELL_CLASS}>
                                            <span className="font-mono text-xs font-bold text-brand-1 tracking-tight">
                                                {invoice.id}
                                            </span>
                                        </TableCell>
                                        <TableCell className={CELL_CLASS}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-[34px]. h-[34px] rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0 select-none`}>
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span
                                                        className="font-semibold text-foreground text-sm truncate max-w-[200px]"
                                                        title={invoice.client}
                                                    >
                                                        {invoice.client}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground font-mono leading-none mt-0.5">
                                                        {invoice.clientRuc || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`${CELL_CLASS} text-xs font-semibold text-muted-foreground`}>
                                            {invoice.date}
                                        </TableCell>
                                        <TableCell className={`${CELL_CLASS} text-right`}>
                                            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                                                {formatCurrency(invoice.amount)}
                                            </span>
                                        </TableCell>
                                        <TableCell className={`${CELL_CLASS} text-right`}>
                                            <span className={`font-mono text-sm font-semibold tabular-nums ${invoice.balance > 0 ? 'text-warning font-bold' : 'text-muted-foreground/60'}`}>
                                                {invoice.balance > 0 ? formatCurrency(invoice.balance) : '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className={CELL_CLASS}>
                                            <StatusBadge
                                                status={invoice.status}
                                                showIcon={true}
                                                className="h-6"
                                            />
                                        </TableCell>
                                        <TableCell className={CELL_CLASS}>
                                            <StatusBadge
                                                status={invoice.paymentStatus}
                                                showIcon={false}
                                                className="h-6"
                                            />
                                        </TableCell>
                                        <TableCell className="px-3 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={`/invoices/${invoice.id}`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-brand-1 rounded-lg"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Ver detalles</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <a
                                                                href={`/api/invoices/${invoice.id}/pdf`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-brand-1 rounded-lg"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                            </a>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Ver PDF</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={`/invoices/${invoice.id}/edit`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-brand-1 rounded-lg"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Editar factura</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={`/invoices/${invoice.id}/payment`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-emerald-600 rounded-lg"
                                                                >
                                                                    <CreditCard className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Registrar cobro</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {invoices.length === 0 && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                                        No hay facturas recientes
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View Card List */}
                <div className="block md:hidden p-4 space-y-3">
                    {currentInvoices.map((invoice, index) => {
                        const gradClass = palette[(startIndex + index) % palette.length];
                        const initials = getInitials(invoice.client) || 'CF';
                        return (
                            <div key={invoice.id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-3 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br ${gradClass} shrink-0 select-none`}>
                                            {initials}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{invoice.client}</h4>
                                            <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">{invoice.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-slate-800 text-xs">{formatCurrency(invoice.amount)}</p>
                                        <p className="text-[9px] text-slate-400 font-semibold">{invoice.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100/60 pt-2 flex-wrap gap-2">
                                    <div className="flex gap-1.5">
                                        <StatusBadge status={invoice.status} showIcon={false} className="h-5 text-[9px] px-2" />
                                        <StatusBadge status={invoice.paymentStatus} showIcon={false} className="h-5 text-[9px] px-2" />
                                    </div>
                                    {invoice.balance > 0 && (
                                        <span className="text-[10px] font-bold text-warning font-mono">
                                            Pendiente: {formatCurrency(invoice.balance)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1.5 border-t border-slate-100/60 pt-2">
                                    <Link href={`/invoices/${invoice.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-bold text-slate-600 rounded-lg">
                                            Detalles
                                        </Button>
                                    </Link>
                                    <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-bold text-slate-600 rounded-lg">
                                            Ver PDF
                                        </Button>
                                    </a>
                                    {invoice.balance > 0 && (
                                        <Link href={`/invoices/${invoice.id}/payment`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-bold text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-lg">
                                                Cobrar
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {invoices.length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                            No hay facturas recientes
                        </div>
                    )}
                </div>
            </CardContent>
            {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between border-t p-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="h-8 gap-1 px-2.5 text-xs font-semibold"
                    >
                        <ChevronLeft className="h-3 w-3" />
                        Anterior
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="h-8 gap-1 px-2.5 text-xs font-semibold"
                    >
                        Siguiente
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
