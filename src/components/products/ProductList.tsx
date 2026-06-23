'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Edit,
    Trash2,
    Package,
    Download,
    History,
    FileUp,
    RotateCcw,
    X
} from 'lucide-react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { ImportProductsDialog } from './ImportProductsDialog';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { deleteProduct, getProductsForExport } from '@/lib/actions/products';
import { toast } from 'sonner';

export interface ProductData {
    id: string;
    codigoInterno: string;
    descripcion: string;
    costoUnitario: number;
    precioVenta: number;
    codigoTasaItbms: string;
    stockActual: number;
    activo: boolean;
    unidadMedida: string;
}

const itbmsConfig: Record<string, string> = {
    '00': 'Exento (0%)',
    '01': '7%',
    '02': '10%',
    '03': '15%',
};

const commonUnits = [
    { value: 'UND', label: 'Unidad (UND)' },
    { value: 'HRS', label: 'Hora (HRS)' },
    { value: 'KG', label: 'Kilogramo (KG)' },
    { value: 'LT', label: 'Litro (LT)' },
    { value: 'MT', label: 'Metro (MT)' },
    { value: 'CJ', label: 'Caja (CJ)' },
    { value: 'SRV', label: 'Servicio (SRV)' },
];

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
    initialSortOrder,
    initialStatus,
    initialTax,
    initialStockStatus,
    initialUnidad
}: {
    initialData: ProductData[];
    pageCount: number;
    currentPage: number;
    pageSize: number;
    totalCount: number;
    initialSearch: string;
    initialSortBy: string;
    initialSortOrder: 'asc' | 'desc';
    initialStatus: string;
    initialTax: string;
    initialStockStatus: string;
    initialUnidad: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [sorting, setSorting] = useState<SortingState>(
        initialSortBy && initialSortOrder
            ? [{ id: initialSortBy, desc: initialSortOrder === 'desc' }]
            : []
    );

    // Active local filter states
    const [globalFilter, setGlobalFilter] = useState(initialSearch);
    const status = initialStatus || 'all';
    const tax = initialTax || 'all';
    const stockStatus = initialStockStatus || 'all';
    const unidad = initialUnidad || 'all';

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

    const handleFilterChange = (key: string, value: string) => {
        const query = createQueryString({ [key]: value === 'all' ? null : value, page: '1' });
        router.push(`${pathname}?${query}`);
    };

    const handleResetFilters = () => {
        setGlobalFilter('');
        router.push(pathname);
    };

    const handleDelete = async (id: string, descripcion: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el producto "${descripcion}"?`)) {
            const result = await deleteProduct(id);
            if (result.success) {
                if (result.deactivated) {
                    toast.warning(result.message || 'Producto desactivado lógicamente.');
                } else {
                    toast.success('Producto eliminado correctamente');
                }
            } else {
                toast.error(result.error || 'Error al eliminar producto');
            }
        }
    };

    const columns: ColumnDef<ProductData>[] = useMemo(() => [
        {
            accessorKey: 'codigoInterno',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 font-semibold text-xs text-slate-700 hover:bg-transparent"
                >
                    Código
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-slate-700 tracking-tight">
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
                    className="-ml-4 font-semibold text-xs text-slate-700 hover:bg-transparent"
                >
                    Producto / Servicio
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 shrink-0 select-none">
                        <Package className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-[280px]" title={row.getValue('descripcion')}>
                        {row.getValue('descripcion')}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'precioVenta',
            header: () => (
                <div className="text-right font-semibold text-xs text-slate-700 pr-2">Precio Venta</div>
            ),
            cell: ({ row }) => {
                const cost = row.original.costoUnitario;
                const price = row.getValue('precioVenta') as number;
                const margin = cost > 0 ? calculateMargin(cost, price) : null;
                return (
                    <div className="text-right pr-2">
                        <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-slate-800 block">
                            {formatCurrency(price)}
                        </span>
                        {margin !== null && (
                            <span className="text-[10px] text-emerald-600 font-bold leading-none mt-0.5 inline-block">
                                Margen: {margin.toFixed(1)}%
                            </span>
                        )}
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
                    <Badge variant={isExempt ? "secondary" : "outline"} className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        isExempt 
                            ? "bg-slate-100 text-slate-600 border-transparent" 
                            : "bg-brand-1/5 text-brand-1 border-brand-1/20"
                    )}>
                        {label}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'stockActual',
            header: () => <div className="text-center">Stock</div>,
            cell: ({ row }) => {
                const stock = row.getValue('stockActual') as number;
                if (stock <= 0) {
                    return (
                        <div className="text-center">
                            <Badge className="bg-red-50 text-red-600 border-transparent hover:bg-red-50 text-[10px] font-bold px-2 py-0.5 rounded">
                                Agotado
                            </Badge>
                        </div>
                    );
                }
                if (stock < 10) {
                    return (
                        <div className="text-center">
                            <Badge className="bg-amber-50 text-amber-600 border-transparent hover:bg-amber-50 text-[10px] font-bold px-2 py-0.5 rounded">
                                {stock} uds
                            </Badge>
                        </div>
                    );
                }
                return (
                    <div className="text-center">
                        <Badge className="bg-emerald-50 text-emerald-600 border-transparent hover:bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded">
                            {stock} uds
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'unidadMedida',
            header: 'Unidad',
            cell: ({ row }) => (
                <span className="text-slate-600 font-semibold text-xs">
                    {row.getValue('unidadMedida') || 'UND'}
                </span>
            ),
        },
        {
            accessorKey: 'activo',
            header: 'Estado',
            cell: ({ row }) => {
                const active = row.getValue('activo') as boolean;
                return (
                    <Badge className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded border-transparent hover:bg-transparent",
                        active 
                            ? "bg-emerald-50 text-emerald-600" 
                            : "bg-red-50 text-red-600"
                    )}>
                        {active ? 'Activo' : 'Inactivo'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand-1 hover:bg-slate-100 rounded-lg" asChild>
                                        <Link href={`/products/${product.id}`}>
                                            <Edit className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Editar</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand-1 hover:bg-slate-100 rounded-lg" asChild>
                                        <Link href={`/products/${product.id}?tab=history`}>
                                            <History className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Historial</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        onClick={() => handleDelete(product.id, product.descripcion)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Eliminar</TooltipContent>
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
        try {
            toast.loading('Generando exportación de productos...');
            
            // Retrieve all matching products from database via Server Action
            const productsToExport = await getProductsForExport({
                search: globalFilter,
                status,
                tax,
                stockStatus,
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Catálogo de Productos');

            // Set report styling metadata headers
            worksheet.addRow(['ERP PANAMÁ SOLUTIONS - CATÁLOGO DE PRODUCTOS']);
            worksheet.addRow([`Fecha de Generación: ${new Date().toLocaleString('es-PA')}`]);
            worksheet.addRow([
                `Filtros Aplicados: Búsqueda: "${globalFilter || 'Ninguna'}", ` +
                `Estado: "${status === 'all' ? 'Todos' : status}", ` +
                `ITBMS: "${tax === 'all' ? 'Todos' : itbmsConfig[tax] || tax}", ` +
                `Stock: "${stockStatus === 'all' ? 'Todos' : stockStatus}"`
            ]);
            worksheet.addRow([]); // Blank spacing

            const headerRow = worksheet.addRow([
                'Código', 'Producto / Servicio', 'Descripción Detallada', 
                'Costo Unitario', 'Precio Venta', 'Tasa ITBMS', 
                'Stock Actual', 'Unidad de Medida', 'Estado', 
                'Fecha Creación', 'Fecha Modificación'
            ]);
            headerRow.font = { bold: true };
            
            productsToExport.forEach((p) => {
                const row = worksheet.addRow([
                    p.codigoInterno,
                    p.descripcion,
                    p.descripcionLarga,
                    p.costoUnitario,
                    p.precioVenta,
                    itbmsConfig[p.codigoTasaItbms] || p.codigoTasaItbms,
                    p.stockActual,
                    p.unidadMedida,
                    p.activo ? 'Activo' : 'Inactivo',
                    new Date(p.createdAt).toLocaleDateString('es-PA'),
                    new Date(p.updatedAt).toLocaleDateString('es-PA')
                ]);

                // Cell Formatting rules
                row.getCell(4).numFmt = '$#,##0.00';
                row.getCell(5).numFmt = '$#,##0.00';
                row.getCell(7).numFmt = '#,##0';
            });

            // Width columns setup
            worksheet.getColumn(1).width = 16;
            worksheet.getColumn(2).width = 30;
            worksheet.getColumn(3).width = 35;
            worksheet.getColumn(4).width = 16;
            worksheet.getColumn(5).width = 16;
            worksheet.getColumn(6).width = 15;
            worksheet.getColumn(7).width = 12;
            worksheet.getColumn(8).width = 12;
            worksheet.getColumn(9).width = 12;
            worksheet.getColumn(10).width = 16;
            worksheet.getColumn(11).width = 16;

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            toast.dismiss();
            toast.success('Catálogo de productos exportado exitosamente.');
            saveAs(blob, `catalogo-productos-${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            toast.dismiss();
            toast.error('Error al exportar productos.');
            console.error(error);
        }
    };

    return (
        <ContentContainer>
            <div className="space-y-4">
                {/* Header with Title and actions (Unified Row) */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-2">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800">Catálogo de Productos</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Gestiona productos y servicios con precios e ITBMS
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportProductsDialog />
                        <Button variant="outline" onClick={handleExport} className="h-9 font-semibold text-xs border-slate-200">
                            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                            Exportar Excel
                        </Button>
                        <Button asChild className="h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs shadow-sm">
                            <Link href="/products/new">
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Nuevo Producto
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Compact Filters Grid (h-10 controls) */}
                <Card className="bg-white shadow-sm border border-slate-100 rounded-xl overflow-visible">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-x-4">
                            {/* Buscar */}
                            <div className="lg:col-span-2 space-y-1">
                                <Label htmlFor="globalSearch" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Buscar producto</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="globalSearch"
                                        placeholder="Código, descripción..."
                                        value={globalFilter}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        className="h-10 text-xs sm:text-sm pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full"
                                    />
                                    {globalFilter && (
                                        <button
                                            type="button"
                                            onClick={() => setGlobalFilter('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="space-y-1">
                                <Label htmlFor="statusFilter" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estado</Label>
                                <Select value={status} onValueChange={(val) => handleFilterChange('status', val)}>
                                    <SelectTrigger id="statusFilter" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos</SelectItem>
                                        <SelectItem value="activo" className="text-xs sm:text-sm cursor-pointer">Activo</SelectItem>
                                        <SelectItem value="inactivo" className="text-xs sm:text-sm cursor-pointer">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ITBMS */}
                            <div className="space-y-1">
                                <Label htmlFor="taxFilter" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">ITBMS</Label>
                                <Select value={tax} onValueChange={(val) => handleFilterChange('tax', val)}>
                                    <SelectTrigger id="taxFilter" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="ITBMS" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos</SelectItem>
                                        <SelectItem value="00" className="text-xs sm:text-sm cursor-pointer">Exento (0%)</SelectItem>
                                        <SelectItem value="01" className="text-xs sm:text-sm cursor-pointer">ITBMS 7%</SelectItem>
                                        <SelectItem value="02" className="text-xs sm:text-sm cursor-pointer">ITBMS 10%</SelectItem>
                                        <SelectItem value="03" className="text-xs sm:text-sm cursor-pointer">ITBMS 15%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Stock */}
                            <div className="space-y-1">
                                <Label htmlFor="stockFilter" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock</Label>
                                <Select value={stockStatus} onValueChange={(val) => handleFilterChange('stockStatus', val)}>
                                    <SelectTrigger id="stockFilter" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Stock" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos</SelectItem>
                                        <SelectItem value="con_stock" className="text-xs sm:text-sm cursor-pointer">Con Stock</SelectItem>
                                        <SelectItem value="sin_stock" className="text-xs sm:text-sm cursor-pointer">Sin Stock</SelectItem>
                                        <SelectItem value="bajo_stock" className="text-xs sm:text-sm cursor-pointer">Bajo Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Unidad */}
                            <div className="space-y-1">
                                <Label htmlFor="unitFilter" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unidad</Label>
                                <Select value={unidad} onValueChange={(val) => handleFilterChange('unidad', val)}>
                                    <SelectTrigger id="unitFilter" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Unidad" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todas</SelectItem>
                                        {commonUnits.map((u) => (
                                            <SelectItem key={u.value} value={u.value} className="text-xs sm:text-sm cursor-pointer">
                                                {u.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto min-h-[300px]">
                            <Table className="border-b border-slate-100">
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id} className="h-10 font-bold text-slate-700 text-xs">
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
                                                className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 cursor-pointer"
                                                onClick={() => router.push(`/products/${row.original.id}`)}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className="py-2.5 text-xs text-slate-600">
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
                                                className="h-64"
                                            >
                                                <EmptyState
                                                    icon={Package}
                                                    title="No se encontraron productos"
                                                    description={globalFilter || status !== 'all' || tax !== 'all' || stockStatus !== 'all' || unidad !== 'all'
                                                        ? "Ningún producto coincide con los filtros aplicados."
                                                        : "Aún no has registrado ningún producto en tu catálogo."}
                                                    action={
                                                        (globalFilter || status !== 'all' || tax !== 'all' || stockStatus !== 'all' || unidad !== 'all') ? (
                                                            <Button onClick={handleResetFilters} variant="outline" className="h-9 font-semibold text-xs border-slate-200 gap-1.5">
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                Restablecer Filtros
                                                            </Button>
                                                        ) : (
                                                            <Button asChild className="h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs shadow-sm">
                                                                <Link href="/products/new">
                                                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                                    Nuevo Producto
                                                                </Link>
                                                            </Button>
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination (Backend Powered) */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/30">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500">
                                <span>
                                    Mostrando {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
                                    {Math.min(currentPage * pageSize, totalCount)} de {totalCount} productos
                                </span>
                                <span className="hidden sm:inline text-slate-200">|</span>
                                <span className="font-semibold text-slate-700">
                                    Página {currentPage} de {pageCount || 1}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="hidden sm:inline">Filas por página:</span>
                                    <Select
                                        value={String(pageSize)}
                                        onValueChange={(val) => {
                                            const query = createQueryString({ limit: val, page: '1' });
                                            router.push(`${pathname}?${query}`);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[65px] text-xs rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="10" className="text-xs cursor-pointer">10</SelectItem>
                                            <SelectItem value="20" className="text-xs cursor-pointer">20</SelectItem>
                                            <SelectItem value="50" className="text-xs cursor-pointer">50</SelectItem>
                                            <SelectItem value="100" className="text-xs cursor-pointer">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const query = createQueryString({ page: String(currentPage - 1) });
                                            router.push(`${pathname}?${query}`);
                                        }}
                                        disabled={currentPage <= 1}
                                        className="h-8 text-xs font-semibold px-3 border-slate-200 rounded-lg"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5 mr-1 text-slate-500" />
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
                                        className="h-8 text-xs font-semibold px-3 border-slate-200 rounded-lg"
                                    >
                                        Siguiente
                                        <ChevronRight className="h-3.5 w-3.5 ml-1 text-slate-500" />
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
