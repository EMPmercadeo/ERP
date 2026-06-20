'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Search,
    Plus,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    FileText,
    Send,
    CheckCircle,
    XCircle,
    Download,
    Eye
} from 'lucide-react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { ImportQuotesDialog } from './ImportQuotesDialog';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { updateQuoteStatus } from '@/app/(dashboard)/quotes/actions';
import { toast } from 'sonner';

interface Quote {
    id: string;
    numero: string;
    cliente: { razonSocial: string };
    fechaEmision: string;
    totalNeto: number;
    estado: string;
}

interface QuotesListProps {
    quotes: Quote[];
}

export function QuotesList({ quotes }: QuotesListProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch for Radix components
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleStatusUpdate = async (id: string, status: string, label: string) => {
        const result = await updateQuoteStatus(id, status);
        if (result.success) {
            toast.success(`Cotización marcada como ${label}`);
        } else {
            toast.error('Error al actualizar estado');
        }
    };

    const handleSendEmail = (id: string) => {
        toast.info('Enviando cotización por correo...');
        // Simulate sending
        setTimeout(() => toast.success('Correo enviado correctamente'), 1500);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aceptada':
                return <Badge className="bg-green-500 hover:bg-green-600">Aceptada</Badge>;
            case 'enviada':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Enviada</Badge>;
            case 'rechazada':
                return <Badge variant="destructive">Rechazada</Badge>;
            default:
                return <Badge variant="secondary">Borrador</Badge>;
        }
    };

    const columns: ColumnDef<Quote>[] = useMemo(() => [
        {
            accessorKey: 'numero',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Número
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-medium">{row.getValue('numero')}</span>,
        },
        {
            accessorKey: 'cliente',
            header: 'Cliente',
            cell: ({ row }) => {
                const cliente = row.getValue('cliente') as { razonSocial: string };
                return <span>{cliente.razonSocial}</span>;
            },
        },
        {
            accessorKey: 'fechaEmision',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Fecha
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => new Date(row.getValue('fechaEmision')).toLocaleDateString('es-PA'),
        },
        {
            accessorKey: 'totalNeto',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => `$${(row.getValue('totalNeto') as number).toFixed(2)}`,
        },
        {
            accessorKey: 'estado',
            header: 'Estado',
            cell: ({ row }) => getStatusBadge(row.getValue('estado')),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const quote = row.original;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                                        <Link href={`/quotes/${quote.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver Detalles</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={() => handleSendEmail(quote.id)}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Enviar</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleStatusUpdate(quote.id, 'aceptada', 'aceptada')}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aceptar</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleStatusUpdate(quote.id, 'rechazada', 'rechazada')}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rechazar</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            },
        },
    ], []);

    const filteredData = useMemo(() => {
        if (statusFilter === 'all') return quotes;
        return quotes.filter(q => q.estado === statusFilter);
    }, [statusFilter, quotes]);

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cotizaciones');

        worksheet.columns = [
            { header: 'Número', key: 'numero', width: 20 },
            { header: 'Cliente', key: 'cliente', width: 30 },
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
        ];

        table.getFilteredRowModel().rows.forEach((row) => {
            const q = row.original;
            worksheet.addRow({
                numero: q.numero,
                cliente: q.cliente.razonSocial,
                fecha: new Date(q.fechaEmision).toLocaleDateString('es-PA'),
                total: q.totalNeto,
                estado: q.estado
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `cotizaciones-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <ContentContainer>
            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Listado de Cotizaciones</h2>
                        <p className="text-muted-foreground">
                            Gestiona las cotizaciones de tus clientes
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ImportQuotesDialog />
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Excel
                        </Button>
                        <Button asChild>
                            <Link href="/quotes/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Cotización
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cotización..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            {isMounted ? (
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger id="quotes-status-filter-trigger" className="w-full sm:w-48">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="borrador">Borrador</SelectItem>
                                        <SelectItem value="enviada">Enviada</SelectItem>
                                        <SelectItem value="aceptada">Aceptada</SelectItem>
                                        <SelectItem value="rechazada">Rechazada</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground opacity-50">
                                    Estado
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-48 text-center">
                                        <EmptyState
                                            title="No hay cotizaciones"
                                            description="Crea tu primera cotización para empezar."
                                            action={
                                                <Button asChild>
                                                    <Link href="/quotes/new">
                                                        Nueva Cotización
                                                    </Link>
                                                </Button>
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t px-4 py-4">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length
                            )}{' '}
                            de {table.getFilteredRowModel().rows.length} resultados
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </ContentContainer>
    );
}
