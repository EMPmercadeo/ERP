'use client';

import { useState } from 'react';
import {
    MoreHorizontal,
    Eye,
    DollarSign,
    FileText,
    Pencil,
    ChevronLeft,
    ChevronRight,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, type DgiStatus } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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

export function RecentActivityTable({ invoices }: RecentActivityTableProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentInvoices = invoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(p => p - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
    };

    return (
        <Card className="h-full bg-white border shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-6 border-b shrink-0">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
                    <CardDescription className="text-xs">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, invoices.length)} de {invoices.length} facturas
                    </CardDescription>
                </div>
                <Link href="/invoices">
                    <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80">
                        Ver todas
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
                <div className="divide-y min-w-[600px] lg:min-w-0">
                    {currentInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between py-2 px-4 hover:bg-muted/30 transition-colors group">
                            {/* Left: Info */}
                            <div className="flex flex-col gap-0.5 min-w-[160px]">
                                <span className="text-sm font-medium text-foreground">{invoice.id}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={invoice.client}>
                                    {invoice.client}
                                </span>
                            </div>

                            {/* Middle: Amount & Statuses */}
                            <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
                                <span className="text-sm font-bold w-[90px] text-right">
                                    {formatCurrency(invoice.amount)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={invoice.status} showIcon={false} className="h-5 px-2 text-[10px] uppercase tracking-wide" />
                                    <StatusBadge status={invoice.paymentStatus} showIcon={false} className="h-5 px-2 text-[10px] uppercase tracking-wide" />
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={`/invoices/${invoice.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
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
                                            <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600">
                                                    <CreditCard className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>Registrar cobro</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    ))}
                    {invoices.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No hay facturas recientes
                        </div>
                    )}
                </div>
            </CardContent>
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <CardFooter className="py-3 px-6 border-t flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="h-8 px-2 gap-1 text-xs"
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
                        className="h-8 px-2 gap-1 text-xs"
                    >
                        Siguiente
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
