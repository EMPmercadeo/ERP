'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
    Package,
    Download,
    History
} from 'lucide-react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { ImportProductsDialog } from './ImportProductsDialog';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { deleteProduct } from '@/lib/actions/products';
import { toast } from 'sonner';

// Types match Prisma model structure roughly
export interface ProductData {
    id: string;
    codigoInterno: string;
    descripcion: string;
    costoUnitario: number;
    precioVenta: number;
    codigoTasaItbms: string;
    stockActual: number;
    activo: boolean;
}

const itbmsConfig: Record<string, string> = {
    '00': 'Exento',
    '01': '7%',
    '02': '10%',
    '03': '15%',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

function calculateMargin(cost: number, price: number): number {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
}

export function ProductList({
    initialData,
    pageCount,
    currentPage,
    pageSize,
    totalCount,
    initialSearch,
    initialSortBy,
    initialSortOrder
}: {
    initialData: ProductData[];
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

    const handleDelete = async (id: string, descripcion: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el producto "${descripcion}"?`)) {
            const result = await deleteProduct(id);
            if (result.success) {
                toast.success('Producto eliminado correctamente');
            } else {
                toast.error('Error al eliminar producto');
            }
        }
    };

    const handleHistory = () => {
        toast.info('La función de historial estará disponible pronto.');
    };

    const columns: ColumnDef<ProductData>[] = useMemo(() => [
        {
            accessorKey: 'codigoInterno',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold"
                >
                    Código
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-brand-1 tracking-tight">
                    {row.getValue('codigoInterno')}
                </span>
            ),
        },
        {
            accessorKey: 'descripcion',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold"
                >
                    Producto / Servicio
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center bg-info-bg text-info shrink-0 select-none">
                        <Package className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-foreground text-sm truncate max-w-[240px]" title={row.getValue('descripcion')}>
                        {row.getValue('descripcion')}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'precioVenta',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold"
                >
                    Precio Venta
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const cost = row.original.costoUnitario;
                const price = row.getValue('precioVenta') as number;
                const margin = calculateMargin(cost, price);
                return (
                    <div className="flex flex-col">
                        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(price)}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
                            Margen: {margin.toFixed(1)}%
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'codigoTasaItbms',
            header: 'ITBMS',
            cell: ({ row }) => {
                const code = row.getValue('codigoTasaItbms') as string;
                const label = itbmsConfig[code] || code;
                const isExempt = code === '00';
                return (
                    <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors",
                        isExempt 
                            ? "bg-secondary text-muted-foreground border-border hover:bg-secondary/90" 
                            : "bg-info-bg text-info border-transparent hover:bg-info-bg/90"
                    )}>
                        {label}
                    </span>
                );
            },
        },
        {
            accessorKey: 'stockActual',
            header: 'Stock',
            cell: ({ row }) => {
                const stock = row.getValue('stockActual') as number;
                if (stock === 0) {
                    return (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-danger-bg text-danger border-transparent">
                            Agotado
                        </span>
                    );
                }
                if (stock < 10) {
                    return (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-warning-bg text-warning border-transparent">
                            {stock} uds
                        </span>
                    );
                }
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-success-bg text-success border-transparent">
                        {stock} uds
                    </span>
                );
            },
        },
        {
            accessorKey: 'activo',
            header: 'Estado',
            cell: ({ row }) => {
                const active = row.getValue('activo') as boolean;
                return (
                    <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors",
                        active 
                            ? "bg-success-bg text-success border-transparent" 
                            : "bg-danger-bg text-danger border-transparent"
                    )}>
                        {active ? 'Activo' : 'Inactivo'}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                                        <Link href={`/products/${product.id}`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={handleHistory}
                                    >
                                        <History className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Historial</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(product.id, product.descripcion)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
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

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Productos');

        worksheet.columns = [
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Descripción', key: 'descripcion', width: 30 },
            { header: 'Precio Venta', key: 'precio', width: 15 },
            { header: 'Costo', key: 'costo', width: 15 },
            { header: 'ITBMS', key: 'itbms', width: 10 },
            { header: 'Stock', key: 'stock', width: 10 },
            { header: 'Activo', key: 'activo', width: 10 },
        ];

        table.getFilteredRowModel().rows.forEach((row) => {
            const p = row.original;
            worksheet.addRow({
                codigo: p.codigoInterno,
                descripcion: p.descripcion,
                precio: p.precioVenta,
                costo: p.costoUnitario,
                itbms: p.codigoTasaItbms,
                stock: p.stockActual,
                activo: p.activo ? 'Sí' : 'No'
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `productos-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <ContentContainer>
            <div className="space-y-4">
                {/* Header with actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Catálogo de Productos</h2>
                        <p className="text-muted-foreground">
                            Gestiona tus productos y servicios con precios e ITBMS
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ImportProductsDialog />
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Excel
                        </Button>
                        <Button asChild>
                            <Link href="/products/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Producto
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
                                placeholder="Buscar por código o descripción..."
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
                                                icon={Package}
                                                title="No hay productos"
                                                description="Crea tu primer producto para comenzar a facturar."
                                                action={
                                                    <Button asChild>
                                                        <Link href="/products/new">
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Nuevo Producto
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
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                <span>
                                    Mostrando {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
                                    {Math.min(currentPage * pageSize, totalCount)} de {totalCount} productos
                                </span>
                                <span className="hidden sm:inline text-muted-foreground/30">|</span>
                                <span className="font-medium text-foreground">
                                    Página {currentPage} de {pageCount || 1}
                                </span>
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
                    </CardContent>
                </Card>
            </div>
        </ContentContainer>
    );
}
