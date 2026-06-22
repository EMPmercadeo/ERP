'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
import { StatusBadge } from '@/components/ui/status-badge';
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
    cliente: { razonSocial: string; ruc?: string; dv?: string | null };
    fechaEmision: string;
    totalNeto: number;
    estado: string;
}

interface QuotesListProps {
    quotes: Quote[];
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

export function QuotesList({
    quotes,
    pageCount,
    currentPage,
    pageSize,
    totalCount,
    initialSearch,
    initialStatus,
    initialSortBy,
    initialSortOrder
}: QuotesListProps & {
    pageCount: number;
    currentPage: number;
    pageSize: number;
    totalCount: number;
    initialSearch: string;
    initialStatus: string;
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
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch for Radix components
    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    const handleStatusChange = (val: string) => {
        setStatusFilter(val);
        const query = createQueryString({ status: val === 'all' ? null : val, page: '1' });
        router.push(`${pathname}?${query}`);
    };

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

    const columns: ColumnDef<Quote>[] = useMemo(() => [
        {
            accessorKey: 'numero',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold"
                >
                    Documento
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-brand-1 tracking-tight">
                    {row.getValue('numero')}
                </span>
            ),
        },
        {
            accessorKey: 'cliente',
            header: 'Cliente',
            cell: ({ row }) => {
                const cliente = row.getValue('cliente') as { razonSocial: string; ruc?: string; dv?: string | null };
                const name = cliente.razonSocial;
                const initials = getInitials(name) || 'CF';
                const gradClass = palette[row.index % palette.length];
                return (
                    <div className="flex items-center gap-3">
                        <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0 select-none`}>
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm truncate max-w-[200px]" title={name}>
                                {name}
                            </span>
                            {cliente.ruc && (
                                <span className="text-[11px] text-muted-foreground font-mono leading-none mt-0.5">
                                    RUC: {cliente.ruc}{cliente.dv ? `-${cliente.dv}` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'fechaEmision',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold"
                >
                    Emisión
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('fechaEmision'));
                return <span className="font-mono text-xs font-semibold text-muted-foreground">{date.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
            },
        },
        {
            accessorKey: 'totalNeto',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold"
                >
                    Monto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const value = row.getValue('totalNeto') as number;
                return (
                    <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(value)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'estado',
            header: 'Estado',
            cell: ({ row }) => (
                <StatusBadge
                    status={row.getValue('estado')}
                    showIcon={false}
                    className="h-6"
                />
            ),
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

    const table = useReactTable({
        data: quotes,
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
        const worksheet = workbook.addWorksheet('Cotizaciones');

        worksheet.columns = [
            { header: 'Número', key: 'numero', width: 20 },
            { header: 'Cliente', key: 'cliente', width: 30 },
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
        ];

        quotes.forEach((q) => {
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
                                <Select value={statusFilter} onValueChange={handleStatusChange}>
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
                    <Card>
                        <div className="overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px] border-b">
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
                        </div>

                        <div className="flex items-center justify-between border-t px-4 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                <span>
                                    Mostrando {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
                                    {Math.min(currentPage * pageSize, totalCount)} de {totalCount} cotizaciones
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
                    </Card>
                </Card>
            </div>
        </ContentContainer>
    );
}
