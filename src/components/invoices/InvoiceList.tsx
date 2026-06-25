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
    Download,
    Plus,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Eye,
    FileX,
    Printer,
    FileText,
    Mail,
    X
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
import { toast } from 'sonner';
import { voidInvoice } from '@/lib/actions/invoices';
import { formatCurrency } from '@/lib/utils/currency';

export interface InvoiceData {
    id: string;
    numeroCompleto: string;
    clientName: string;
    clientRuc: string;
    fechaEmision: string; // ISO string
    fechaVencimiento?: string | null; // ISO string
    totalNeto: number;
    saldoPendiente: number;
    estadoDgi: string; // "borrador" | "pendiente" | "aceptada" | "rechazada" | "anulada"
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



export function InvoiceList({
    initialData,
    pageCount,
    currentPage,
    pageSize,
    totalCount,
    initialSearch,
    initialStatus,
    initialSortBy,
    initialSortOrder
}: {
    initialData: InvoiceData[];
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

    const [baseUrl, setBaseUrl] = useState('');
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const showShareModal = searchParams.get('created') === 'true';
    const shareInvoiceId = searchParams.get('id');
    const shareInvoiceNum = searchParams.get('num');
    const shareInvoiceTotal = parseFloat(searchParams.get('total') || '0');

    const [sorting, setSorting] = useState<SortingState>(
        initialSortBy && initialSortOrder
            ? [{ id: initialSortBy, desc: initialSortOrder === 'desc' }]
            : []
    );
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

    const handleVoid = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas anular esta factura? Se generará una Nota de Crédito en el sistema y el saldo pendiente pasará a $0.00.')) {
            try {
                const res = await voidInvoice(id);
                if (res.success) {
                    toast.success(res.message);
                    router.refresh();
                } else {
                    toast.error(res.message);
                }
            } catch (error) {
                toast.error('Error al intentar anular la factura.');
            }
        }
    };



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

    const columns: ColumnDef<InvoiceData>[] = useMemo(() => [
        {
            accessorKey: 'numeroCompleto',
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
                    {row.getValue('numeroCompleto')}
                </span>
            ),
        },
        {
            accessorKey: 'clientName',
            header: 'Cliente',
            cell: ({ row }) => {
                const name = row.getValue('clientName') as string;
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
                            <span className="text-[11px] text-muted-foreground font-mono leading-none mt-0.5">
                                {row.original.clientRuc}
                            </span>
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
            }
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
            accessorKey: 'saldoPendiente',
            header: 'Saldo',
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
            accessorKey: 'estadoDgi',
            header: 'DGI',
            cell: ({ row }) => {
                const status = row.getValue('estadoDgi') as DgiStatus;
                return (
                    <StatusBadge
                        status={status}
                        showIcon={true}
                        className="h-6"
                    />
                );
            },
            filterFn: (row, id, filterValue) => {
                if (filterValue === 'all') return true;
                return row.getValue(id) === filterValue;
            },
        },
        {
            id: 'pago',
            header: 'Pago',
            cell: ({ row }) => {
                const total = row.original.totalNeto;
                const balance = row.original.saldoPendiente;
                const vencimiento = row.original.fechaVencimiento ? new Date(row.original.fechaVencimiento) : null;
                const paymentStatus = balance === 0
                    ? 'pagada'
                    : (vencimiento && vencimiento < new Date() && balance > 0)
                        ? 'vencida'
                        : balance === total
                            ? 'pendiente'
                            : 'parcial';

                return (
                    <StatusBadge
                        status={paymentStatus}
                        showIcon={false}
                        className="h-6"
                    />
                );
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
                            <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}?print=true`)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/invoices/${invoice.id}?print=true`, '_blank')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Descargar PDF
                            </DropdownMenuItem>

                            {invoice.estadoDgi === 'aceptada' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleVoid(invoice.id)}>
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

        initialData.forEach((inv) => {
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
                            <Select value={statusFilter} onValueChange={handleStatusChange}>
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
                                            data-state={row.getIsSelected() && 'selected'}
                                            className="cursor-pointer hover:bg-accent"
                                            onClick={(e) => {
                                                const target = e.target as HTMLElement;
                                                if (
                                                    target.closest('button') ||
                                                    target.closest('a') ||
                                                    target.closest('[role="checkbox"]') ||
                                                    target.closest('.dropdown-menu')
                                                ) {
                                                    return;
                                                }
                                                router.push(`/invoices/${row.original.id}`);
                                            }}
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
                        </div>

                        {/* Mobile Card List View */}
                        <div className="block md:hidden p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto min-h-[300px] border-b">
                            {initialData.length > 0 ? (
                                initialData.map((invoice, index) => {
                                    const initials = getInitials(invoice.clientName) || 'CF';
                                    const gradClass = palette[index % palette.length];
                                    const balance = invoice.saldoPendiente;
                                    const total = invoice.totalNeto;
                                    const paymentStatus = balance === 0
                                        ? 'pagada'
                                        : balance === total
                                            ? 'pendiente'
                                            : 'parcial';

                                    return (
                                        <div 
                                            key={invoice.id} 
                                            onClick={() => router.push(`/invoices/${invoice.id}`)}
                                            className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-3 shadow-sm active:scale-98 transition-transform cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br ${gradClass} shrink-0 select-none`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{invoice.clientName}</h4>
                                                        <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">{invoice.numeroCompleto}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono font-bold text-slate-800 text-xs">{formatCurrency(invoice.totalNeto)}</p>
                                                    <p className="text-[9px] text-slate-400 font-semibold">{new Date(invoice.fechaEmision).toLocaleDateString('es-PA')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100/60 pt-2 flex-wrap gap-2">
                                                <div className="flex gap-1.5">
                                                    <StatusBadge status={invoice.estadoDgi} showIcon={false} className="h-5 text-[9px] px-2" />
                                                    <StatusBadge status={paymentStatus} showIcon={false} className="h-5 text-[9px] px-2" />
                                                </div>
                                                {balance > 0 && (
                                                    <span className="text-[10px] font-bold text-warning font-mono">
                                                        Saldo: {formatCurrency(balance)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                                    No hay facturas registradas
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t px-4 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                <span>
                                    Mostrando {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
                                    {Math.min(currentPage * pageSize, totalCount)} de {totalCount} facturas
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

            {/* Modal de Compartir Factura Creada */}
            {showShareModal && shareInvoiceId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => router.replace('/invoices')}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 mb-2">
                                    <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">¡Factura Emitida y Timbrada!</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    El documento ha sido procesado de forma oficial y autorizado por la DGI.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">No. Documento:</span>
                                    <span className="font-mono font-bold text-brand-1 dark:text-blue-400">{shareInvoiceNum}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Facturado:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">{formatCurrency(shareInvoiceTotal)}</span>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Compartir con el Cliente
                                </label>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={baseUrl && shareInvoiceNum && shareInvoiceId ? `https://api.whatsapp.com/send?text=${encodeURIComponent(`Hola, adjunto su factura electrónica ${shareInvoiceNum} por un total de ${formatCurrency(shareInvoiceTotal)}. Puede visualizarla en el siguiente enlace: ${baseUrl}/invoices/${shareInvoiceId}`)}` : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                                    >
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.062 5.248 5.308 0 11.777 0c3.137 0 6.085 1.22 8.302 3.439 2.219 2.219 3.438 5.168 3.436 8.307-.005 6.522-5.252 11.77-11.72 11.77-2.002-.001-3.97-.512-5.713-1.488L0 24zm6.59-4.859c1.72.1.085-.34 2.82.28 1.48.33 2.92.51 4.38.51 5.388 0 9.77-4.386 9.773-9.775.002-2.61-1.014-5.064-2.865-6.916C17.95 1.42 15.5 .4 12.89.4 7.502.4 3.12 4.78 3.117 10.165c-.002 1.63.39 3.22 1.13 4.64l.16.29-1.01 3.69 3.79-.99.3.18c1.35.8 2.9 1.22 4.47 1.22zM17.3 14.3c-.3-.15-1.78-.88-2.06-.98-.28-.1-.49-.15-.69.15-.2.3-.77.98-.95 1.18-.18.2-.36.23-.66.08-1.54-.77-2.58-1.34-3.56-3.03-.26-.45.26-.42.74-1.38.08-.16.04-.3-.02-.45-.06-.15-.49-1.18-.67-1.62-.18-.43-.37-.37-.5-.38l-.43-.01c-.15 0-.39.06-.6.28-.2.22-.8.78-.8 1.9s.82 2.2 1.05 2.5c.23.3 1.6 2.44 3.88 3.42.54.23 1 .37 1.34.48.55.17 1.05.15 1.44.09.44-.06 1.35-.55 1.54-1.08.19-.53.19-1 .13-1.08-.07-.08-.26-.13-.56-.28z"/>
                                        </svg>
                                        WhatsApp
                                    </a>
                                    <a
                                        href={baseUrl && shareInvoiceNum && shareInvoiceId ? `mailto:?subject=${encodeURIComponent(`Factura Electrónica ${shareInvoiceNum}`)}&body=${encodeURIComponent(`Hola, adjunto su factura electrónica ${shareInvoiceNum} por un total de ${formatCurrency(shareInvoiceTotal)}.\n\nPuede visualizarla en el siguiente enlace: ${baseUrl}/invoices/${shareInvoiceId}`)}` : '#'}
                                        className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                                    >
                                        <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        Correo
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="h-11 rounded-xl font-bold text-xs"
                                        onClick={() => {
                                            toast.info('Abriendo vista de impresión...');
                                            window.open(`/invoices/${shareInvoiceId}/print`, '_blank');
                                        }}
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="h-11 rounded-xl font-bold text-xs"
                                        asChild
                                    >
                                        <Link href={`/invoices/${shareInvoiceId}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver Detalle
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
                                onClick={() => router.replace('/invoices')}
                            >
                                Listo
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ContentContainer>
    );
}
