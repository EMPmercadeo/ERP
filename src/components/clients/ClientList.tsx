'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
    ColumnDef,
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
    Edit,
    Trash2,
    Phone,
    Mail,
    Users,
    Download
} from 'lucide-react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { ImportClientsDialog } from './ImportClientsDialog';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types match Prisma model structure roughly
// We'll define a simpler frontend interface
export interface ClientData {
    id: string;
    tipoRuc: string;
    ruc: string;
    dv: string | null;
    razonSocial: string;
    email: string | null;
    telefono: string | null;
    saldoPendiente: number; // Decimal string from prisma, parsed to number
    estado: string;
}

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'neutral'> = {
    activo: 'success',
    moroso: 'warning',
    bloqueado: 'destructive',
};

const statusLabels: Record<string, string> = {
    activo: 'Activo',
    moroso: 'Moroso',
    bloqueado: 'Bloqueado',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function ClientList({ initialData }: { initialData: ClientData[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const columns: ColumnDef<ClientData>[] = useMemo(() => [
        {
            accessorKey: 'razonSocial',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Cliente
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.getValue('razonSocial')}</div>
                    <div className="text-xs text-muted-foreground">
                        RUC: {row.original.ruc}{row.original.dv ? `-${row.original.dv}` : ''}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Contacto',
            cell: ({ row }) => (
                <div className="space-y-1">
                    {row.original.email && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {row.original.email}
                        </div>
                    )}
                    {row.original.telefono && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {row.original.telefono}
                        </div>
                    )}
                    {!row.original.email && !row.original.telefono && (
                        <span className="text-muted-foreground text-sm">Sin contacto</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'saldoPendiente',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Saldo Pendiente
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const value = row.getValue('saldoPendiente') as number;
                if (value === 0) return <span className="text-muted-foreground">$0.00</span>;
                return <Badge variant="warning">{formatCurrency(value)}</Badge>;
            },
        },
        {
            accessorKey: 'estado',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.getValue('estado') as string;
                const variant = statusVariants[status] || 'neutral';
                const label = statusLabels[status] || status;
                return (
                    <Badge variant={variant}>
                        {label}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const client = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" suppressHydrationWarning>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Ver facturas
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Ver estado de cuenta
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], []);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const table = useReactTable({
        data: initialData,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            sorting,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 8,
            },
        },
    });

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        worksheet.columns = [
            { header: 'Razón Social', key: 'nombre', width: 30 },
            { header: 'RUC', key: 'ruc', width: 15 },
            { header: 'Tipo RUC', key: 'tipo', width: 10 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Teléfono', key: 'tel', width: 15 },
            { header: 'Saldo', key: 'saldo', width: 15 },
            { header: 'Estado', key: 'estado', width: 10 },
        ];

        table.getFilteredRowModel().rows.forEach((row) => {
            const c = row.original;
            worksheet.addRow({
                nombre: c.razonSocial,
                ruc: c.ruc,
                tipo: c.tipoRuc,
                email: c.email || '',
                tel: c.telefono || '',
                saldo: c.saldoPendiente,
                estado: c.estado
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `clientes-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (!isMounted) {
        return null;
    }

    return (
        <ContentContainer className="py-4">
            <div className="space-y-4">
                {/* Header with actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gestión de Clientes</h2>
                        <p className="text-muted-foreground">
                            Administra tu cartera de clientes y sus saldos
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ImportClientsDialog />
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Excel
                        </Button>
                        <Button asChild>
                            <Link href="/clients/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Cliente
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, RUC o email..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-8"
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
                                                icon={Users}
                                                title="No hay clientes"
                                                description="Registra tu primer cliente para comenzar a facturar."
                                                action={
                                                    <Button asChild>
                                                        <Link href="/clients/new">
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Nuevo Cliente
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
                                {table.getFilteredRowModel().rows.length} clientes
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
