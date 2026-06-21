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

const ITEMS_PER_PAGE = 4;
const HEAD_CLASS = 'h-auto bg-surface-light px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground';

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
        <Card className="flex h-full flex-col bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
                    <CardDescription className="text-xs">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, invoices.length)} de {invoices.length} facturas
                    </CardDescription>
                </div>
                <Link href="/invoices">
                    <Button variant="ghost" size="sm" className="gap-1 text-brand-1 hover:text-brand-1/80">
                        Ver todas
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
                <Table className="min-w-[680px]">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className={HEAD_CLASS}>Documento</TableHead>
                            <TableHead className={HEAD_CLASS}>Cliente</TableHead>
                            <TableHead className={`${HEAD_CLASS} text-right`}>Monto</TableHead>
                            <TableHead className={HEAD_CLASS}>Estado DGI</TableHead>
                            <TableHead className={HEAD_CLASS}>Pago</TableHead>
                            <TableHead className={`${HEAD_CLASS} w-px`} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentInvoices.map((invoice) => (
                            <TableRow key={invoice.id} className="group hover:bg-surface-light/60">
                                <TableCell className="px-4 py-3">
                                    <span className="font-mono text-xs font-medium text-brand-1">{invoice.id}</span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span
                                        className="block max-w-[180px] truncate font-medium text-foreground"
                                        title={invoice.client}
                                    >
                                        {invoice.client}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                    <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                                        {formatCurrency(invoice.amount)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <StatusBadge
                                        status={invoice.status}
                                        showIcon={false}
                                        className="h-5 px-2 text-[10px] uppercase tracking-wide"
                                    />
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <StatusBadge
                                        status={invoice.paymentStatus}
                                        showIcon={false}
                                        className="h-5 px-2 text-[10px] uppercase tracking-wide"
                                    />
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link href={`/invoices/${invoice.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-brand-1"
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
                                                            className="h-8 w-8 text-muted-foreground hover:text-brand-1"
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
                                                            className="h-8 w-8 text-muted-foreground hover:text-brand-1"
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
                                                            className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
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
                        ))}
                        {invoices.length === 0 && (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                                    No hay facturas recientes
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between border-t py-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="h-8 gap-1 px-2 text-xs"
                    >
                        <ChevronLeft className="h-3 w-3" />
                        Anterior
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="h-8 gap-1 px-2 text-xs"
                    >
                        Siguiente
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
