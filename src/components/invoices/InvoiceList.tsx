'use client';

import { useState, useMemo } from 'react';
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
    Download,
    Plus,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Eye,
    FileX,
    Printer,
    FileText
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, type DgiStatus } from '@/components/ui/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { ImportInvoicesDialog } from './ImportInvoicesDialog';

export interface InvoiceData {
    id: string;
    numeroCompleto: string;
    clientName: string;
    clientRuc: string;
    fechaEmision: string; // ISO string
    totalNeto: number;
    saldoPendiente: number;
    estadoDgi: string; // "borrador" | "pendiente" | "aceptada" | "rechazada" | "anulada"
}



function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function InvoiceList({ initialData }: { initialData: InvoiceData[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const columns: ColumnDef<InvoiceData>[] = useMemo(() => [
        {
            accessorKey: 'numeroCompleto',
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
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.getValue('numeroCompleto')}</span>
            ),
        },
        {
            accessorKey: 'clientName',
            header: 'Cliente',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.getValue('clientName')}</div>
                    <div className="text-xs text-muted-foreground">{row.original.clientRuc}</div>
                </div>
            ),
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
            cell: ({ row }) => {
                const date = new Date(row.getValue('fechaEmision'));
                return <span>{date.toLocaleDateString('es-PA')}</span>
            }
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
            cell: ({ row }) => {
                const value = row.getValue('totalNeto') as number;
                return (
                    <span className={value < 0 ? 'text-red-600' : ''}>
                        {formatCurrency(value)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'saldoPendiente',
            header: 'Saldo',
            cell: ({ row }) => {
                const value = row.getValue('saldoPendiente') as number;
                if (value === 0) return <Badge variant="success">Pagada</Badge>;
                return <Badge variant="warning">{formatCurrency(value)}</Badge>;
            },
        },
        {
            accessorKey: 'estadoDgi',
            header: 'Estado DGI',
            cell: ({ row }) => {
                const status = row.getValue('estadoDgi') as DgiStatus;
                return <StatusBadge status={status} />;
            },
            filterFn: (row, id, filterValue) => {
                if (filterValue === 'all') return true;
                return row.getValue(id) === filterValue;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const invoice = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild id={`actions-${invoice.id}`}>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar XML
                            </DropdownMenuItem>
                            {invoice.estadoDgi === 'aceptada' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                        <FileX className="mr-2 h-4 w-4" />
                                        Anular (crear NC)
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], []);

    const filteredData = useMemo(() => {
        if (statusFilter === 'all') return initialData;
        return initialData.filter(inv => inv.estadoDgi === statusFilter);
    }, [statusFilter, initialData]);

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



    // ... (existing imports)

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Facturas');

        worksheet.columns = [
            { header: 'Número', key: 'numero', width: 20 },
            { header: 'Cliente', key: 'cliente', width: 30 },
            { header: 'RUC', key: 'ruc', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
        ];

        filteredData.forEach((inv) => {
            worksheet.addRow({
                numero: inv.numeroCompleto,
                cliente: inv.clientName,
                ruc: inv.clientRuc,
                fecha: new Date(inv.fechaEmision).toLocaleDateString('es-PA'),
                total: inv.totalNeto,
                estado: inv.estadoDgi,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `facturas-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <ContentContainer>
            <div className="space-y-4">
                {/* Header with actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Listado de Facturas</h2>
                        <p className="text-muted-foreground">
                            Gestiona tus facturas electrónicas y notas de crédito
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ImportInvoicesDialog />
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Excel
                        </Button>
                        <Button asChild>
                            <Link href="/invoices/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Factura
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por número, cliente o RUC..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            {/* Status filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger id="status-filter-trigger" className="w-full sm:w-48">
                                    <SelectValue placeholder="Estado DGI" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="borrador">Borrador</SelectItem>
                                    <SelectItem value="pendiente">Pendiente DGI</SelectItem>
                                    <SelectItem value="aceptada">Aceptada</SelectItem>
                                    <SelectItem value="rechazada">Rechazada</SelectItem>
                                    <SelectItem value="anulada">Anulada</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date range - placeholder */}
                            <Input
                                type="date"
                                className="w-full sm:w-40"
                                placeholder="Desde"
                            />
                            <Input
                                type="date"
                                className="w-full sm:w-40"
                                placeholder="Hasta"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
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
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && 'selected'}
                                            className="cursor-pointer hover:bg-accent"
                                        >
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
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-48"
                                        >
                                            <EmptyState
                                                icon={FileText}
                                                title="No hay facturas"
                                                description="Crea tu primera factura electrónica."
                                                action={
                                                    <Button asChild>
                                                        <Link href="/invoices/new">
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Nueva Factura
                                                        </Link>
                                                    </Button>
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
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
                    </CardContent>
                </Card>
            </div>
        </ContentContainer>
    );
}
