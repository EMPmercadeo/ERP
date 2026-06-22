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
import { toast } from 'sonner';
import { voidInvoice } from '@/lib/actions/invoices';

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

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

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

    const handleDownloadXml = (invoice: InvoiceData) => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://dgi.mef.gob.pa/DocumentoElectronico" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dVerFor>1.00</dVerFor>
    <gDE>
        <dNumDoc>${invoice.numeroCompleto}</dNumDoc>
        <dFecEmis>${invoice.fechaEmision}</dFecEmis>
        <gEmis>
            <dNombEmis>Tu Empresa S.A.</dNombEmis>
            <dRucEmis>123456-1-123456</dRucEmis>
        </gEmis>
        <gRecep>
            <dNombRec>${invoice.clientName}</dNombRec>
            <dRucRec>${invoice.clientRuc}</dRucRec>
        </gRecep>
        <gTot>
            <dTotNet>${invoice.totalNeto}</dTotNet>
            <dTotSal>${invoice.saldoPendiente}</dTotSal>
        </gTot>
    </gDE>
</rDE>`;
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        saveAs(blob, `factura-${invoice.numeroCompleto}.xml`);
        toast.success('XML de Factura Electrónica descargado');
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
                            <DropdownMenuItem onClick={() => handleDownloadXml(invoice)}>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar XML
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
        </ContentContainer>
    );
}
