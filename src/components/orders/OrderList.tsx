'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Plus, FileText, CheckCircle, Clock } from 'lucide-react';
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

export function OrderList({ initialData }: { initialData: OrderData[] }) {
    const [orders, setOrders] = useState<OrderData[]>(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setOrders(initialData);
    }, [initialData]);

    if (!isMounted) return null;

    const filteredOrders = orders.filter((o) =>
        o.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente.ruc.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        Gestión comercial de pedidos y compromisos de entrega al estilo Sage 50
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
                </CardContent>
            </Card>
        </ContentContainer>
    );
}
