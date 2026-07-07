'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, FileText, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { updateSalesOrderStatus } from '@/lib/actions/sales-orders';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface OrderData {
    id: string;
    numero: string;
    fechaEmision: string;
    fechaEntrega: string | null;
    totalNeto: number;
    estado: string;
    observaciones: string | null;
    cliente: {
        razonSocial: string;
        ruc: string;
    };
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function OrderList({
    initialData,
    pageCount = 1,
    currentPage = 1,
    pageSize = 20,
    totalCount = 0,
    initialSearch = ''
}: {
    initialData: OrderData[];
    pageCount?: number;
    currentPage?: number;
    pageSize?: number;
    totalCount?: number;
    initialSearch?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [orders, setOrders] = useState<OrderData[]>(initialData);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [isMounted, setIsMounted] = useState(false);

    const createQueryString = useCallback((params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(params)) {
            if (value === null) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        }
        return newParams.toString();
    }, [searchParams]);

    /* eslint-disable react-hooks/exhaustive-deps -- ejecutarse solo cuando cambia searchTerm para evitar loop */
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = searchParams.get('search') || '';
            if (searchTerm !== currentSearch) {
                const query = createQueryString({ search: searchTerm || null, page: '1' });
                router.push(`${pathname}?${query}`);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    /* eslint-enable react-hooks/exhaustive-deps */

    useEffect(() => {
        setIsMounted(true);
        setOrders(initialData);
    }, [initialData]);

    if (!isMounted) return null;

    const filteredOrders = orders;

    const handleStatusChange = async (id: string, newStatus: string) => {
        const res = await updateSalesOrderStatus(id, newStatus);
        if (res.success) {
            toast.success(`Estado actualizado a ${newStatus}`);
            setOrders(orders.map(o => o.id === id ? { ...o, estado: newStatus } : o));
        } else {
            toast.error(res.message || 'Error al actualizar estado');
        }
    };

    return (
        <ContentContainer>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pedidos de Venta</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestión comercial de pedidos y compromisos de entrega
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/quotes">
                        <Button variant="outline" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Desde Cotización
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="mb-6 shadow-sm border-gray-200">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por número, cliente o RUC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-full md:w-96"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/75">
                                    <TableHead className="font-semibold text-gray-600">Número</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Cliente</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Emisión</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Entrega Estimada</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Total Neto</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                            No se encontraron pedidos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-medium text-gray-900">{order.numero}</TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900">{order.cliente.razonSocial}</div>
                                                <div className="text-xs text-gray-500">RUC: {order.cliente.ruc}</div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{order.fechaEmision}</TableCell>
                                            <TableCell className="text-gray-600">{order.fechaEntrega || '—'}</TableCell>
                                            <TableCell className="text-right font-semibold text-gray-900">
                                                {formatCurrency(order.totalNeto)}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={order.estado}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {order.estado === 'pendiente' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                                                            onClick={() => handleStatusChange(order.id, 'en_proceso')}
                                                        >
                                                            <Clock className="h-3.5 w-3.5" />
                                                            Procesar
                                                        </Button>
                                                    )}
                                                    {order.estado === 'en_proceso' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                                                            onClick={() => handleStatusChange(order.id, 'entregado')}
                                                        >
                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                            Entregado
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50/50 mt-4 rounded-b-lg">
                        <div className="text-sm text-muted-foreground">
                            Mostrando <span className="font-medium">{initialData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> de <span className="font-medium">{totalCount}</span> resultados
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
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const query = createQueryString({ page: String(currentPage + 1) });
                                        router.push(`${pathname}?${query}`);
                                    }}
                                    disabled={currentPage >= pageCount || pageCount === 0}
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </ContentContainer>
    );
}
