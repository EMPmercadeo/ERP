'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { deleteClient } from '@/lib/actions/clients';
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
import { StatusBadge } from '@/components/ui/status-badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Types match Prisma model structure roughly
export interface ClientData {
    id: string;
    tipoRuc: string;
    ruc: string;
    dv: string | null;
    razonSocial: string;
    email: string | null;
    telefono: string | null;
    saldoPendiente: number;
    estado: string;
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
    'from-blue-600 to-teal-400 text-white',
    'from-emerald-500 to-teal-400 text-white',
    'from-amber-500 to-orange-400 text-white',
    'from-indigo-500 to-purple-400 text-white',
    'from-rose-500 to-red-400 text-white',
    'from-blue-500 to-indigo-400 text-white'
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function ClientList({
    initialData,
    pageCount,
    currentPage,
    pageSize,
    totalCount,
    initialSearch,
    initialSortBy,
    initialSortOrder
}: {
    initialData: ClientData[];
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

    const [sorting, setSorting] = useState<SortingState>(
        initialSortBy && initialSortOrder
            ? [{ id: initialSortBy, desc: initialSortOrder === 'desc' }]
            : []
    );
    const [globalFilter, setGlobalFilter] = useState(initialSearch);

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

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
            try {
                const res = await deleteClient(id);
                if (res.success) {
                    toast.success(res.message);
                    router.refresh();
                } else {
                    toast.error(res.message);
                }
            } catch (error) {
                toast.error('Error al intentar eliminar el cliente.');
            }
        }
    };

    const columns: ColumnDef<ClientData>[] = useMemo(() => [
        {
            accessorKey: 'razonSocial',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold"
                >
                    Cliente
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const name = row.getValue('razonSocial') as string;
                const initials = getInitials(name) || 'CF';
                const gradClass = palette[row.index % palette.length];
                return (
                    <div className="flex items-center gap-3">
                        <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0 select-none`}>
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm truncate max-w-[220px]" title={name}>
                                {name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono leading-none mt-0.5">
                                RUC: {row.original.ruc}{row.original.dv ? `-${row.original.dv}` : ''}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'email',
            header: 'Contacto',
            cell: ({ row }) => (
                <div className="space-y-1">
                    {row.original.email && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/80" />
                            {row.original.email}
                        </div>
                    )}
                    {row.original.telefono && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/80" />
                            {row.original.telefono}
                        </div>
                    )}
                    {!row.original.email && !row.original.telefono && (
                        <span className="text-muted-foreground/50 text-xs">Sin contacto</span>
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
                    className="-ml-4 font-semibold"
                >
                    Saldo Pendiente
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const value = row.getValue('saldoPendiente') as number;
                return (
                    <span className={`font-mono text-sm font-semibold tabular-nums ${value > 0 ? 'text-warning font-bold' : 'text-muted-foreground/60'}`}>
                        {value > 0 ? formatCurrency(value) : '—'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'estado',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.getValue('estado') as string;
                return (
                    <StatusBadge
                        status={status}
                        showIcon={false}
                        className="h-6"
                    />
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
                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}?tab=invoices`)}>
                                Ver facturas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}?tab=statement`)}>
                                Ver estado de cuenta
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(client.id)}
                            >
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
        pageCount: pageCount,
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        onSortingChange: (updater) => {
            const nextSorting = typeof updater === 'function' ? updater(sorting) : updater;
            setSorting(nextSorting);
            if (nextSorting.length > 0) {
                const { id, desc } = nextSorting[0];
                const query = createQueryString({
                    sortBy: id,
                    sortOrder: desc ? 'desc' : 'asc',
                    page: '1'
                });
                router.push(`${pathname}?${query}`);
            } else {
                const query = createQueryString({
                    sortBy: null,
                    sortOrder: null,
                    page: '1'
                });
                router.push(`${pathname}?${query}`);
            }
        },
        getCoreRowModel: getCoreRowModel(),
        state: {
            sorting,
            globalFilter,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: pageSize,
            }
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
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px] border-b">
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
                                            onClick={(e) => {
                                                const target = e.target as HTMLElement;
                                                if (target.closest('.actions-cell') || target.closest('button')) {
                                                    return;
                                                }
                                                router.push(`/clients/${row.original.id}`);
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell 
                                                    key={cell.id}
                                                    className={cell.column.id === 'actions' ? 'actions-cell' : ''}
                                                >
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
                        </div>

                        {/* Mobile Card List View */}
                        <div className="block md:hidden p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto min-h-[300px] border-b font-sans">
                            {initialData.length > 0 ? (
                                initialData.map((client, index) => {
                                    const initials = getInitials(client.razonSocial) || 'CL';
                                    const gradClass = palette[index % palette.length];
                                    return (
                                        <div 
                                            key={client.id}
                                            onClick={() => router.push(`/clients/${client.id}`)}
                                            className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-3 shadow-sm active:scale-98 transition-transform cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br ${gradClass} shrink-0 select-none`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{client.razonSocial}</h4>
                                                        <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">RUC: {client.ruc} - DV {client.dv || '—'}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={client.estado} showIcon={false} className="h-5 text-[9px] px-2 shrink-0" />
                                            </div>
                                            
                                            {(client.telefono || client.email) && (
                                                <div className="flex flex-col gap-1 text-[10px] text-slate-500 border-t border-slate-100/60 pt-2">
                                                    {client.telefono && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            <span>{client.telefono}</span>
                                                        </div>
                                                    )}
                                                    {client.email && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="h-3 w-3 text-slate-400" />
                                                            <span className="truncate max-w-[200px]">{client.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-1.5 border-t border-slate-100/60 pt-2">
                                                <Link href={`/clients/${client.id}`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-bold text-slate-600 rounded-lg">
                                                        Detalle
                                                    </Button>
                                                </Link>
                                                <Link href={`/clients/${client.id}/edit`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-bold text-slate-600 rounded-lg">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Link href={`/invoices/new?clienteId=${client.id}`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full h-9 text-[10px] font-bold text-brand-1 border-brand-1/10 hover:bg-brand-1/5 rounded-lg">
                                                        Facturar
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                                    No hay clientes registrados
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t px-4 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                <span>
                                    Mostrando {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
                                    {Math.min(currentPage * pageSize, totalCount)} de {totalCount} clientes
                                </span>
                                <span className="hidden sm:inline text-muted-foreground/30">|</span>
                                <span className="font-medium text-foreground">
                                    Página {currentPage} de {pageCount || 1}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="hidden sm:inline">Filas por página:</span>
                                    <Select
                                        value={String(pageSize)}
                                        onValueChange={(val) => {
                                            const query = createQueryString({ limit: val, page: '1' });
                                            router.push(`${pathname}?${query}`);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const query = createQueryString({ page: String(currentPage - 1) });
                                            router.push(`${pathname}?${query}`);
                                        }}
                                        disabled={currentPage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
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
                                    >
                                        Siguiente
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ContentContainer>
    );
}
