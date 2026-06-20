'use client';

import { useState, useMemo } from 'react';
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
    Package,
    Download,
    History
} from 'lucide-react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { ImportProductsDialog } from './ImportProductsDialog';
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

export function ProductList({ initialData }: { initialData: ProductData[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

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
            header: 'Código',
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.getValue('codigoInterno')}</span>
            ),
        },
        {
            accessorKey: 'descripcion',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Producto / Servicio
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{row.getValue('descripcion')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'precioVenta',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Precio
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{formatCurrency(row.getValue('precioVenta'))}</div>
                    <div className="text-xs text-muted-foreground">
                        Margen: {calculateMargin(row.original.costoUnitario, row.original.precioVenta).toFixed(1)}%
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'codigoTasaItbms',
            header: 'ITBMS',
            cell: ({ row }) => {
                const code = row.getValue('codigoTasaItbms') as string;
                return (
                    <Badge variant={code === '00' ? 'secondary' : 'default'}>
                        {itbmsConfig[code] || code}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'stockActual',
            header: 'Stock',
            cell: ({ row }) => {
                const stock = row.getValue('stockActual') as number;
                if (stock === 0) {
                    return <Badge variant="destructive">Agotado</Badge>;
                }
                if (stock < 10) {
                    return <Badge className="bg-yellow-500 hover:bg-yellow-600">{stock} uds</Badge>;
                }
                return <span>{stock} uds</span>;
            },
        },
        {
            accessorKey: 'activo',
            header: 'Estado',
            cell: ({ row }) => {
                const active = row.getValue('activo') as boolean;
                return (
                    <Badge variant={active ? 'outline' : 'destructive'} className={active ? "bg-green-50 text-green-700 border-green-200" : ""}>
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
                pageSize: 10,
            },
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
                            <div className="text-sm text-muted-foreground">
                                {table.getFilteredRowModel().rows.length} productos
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
