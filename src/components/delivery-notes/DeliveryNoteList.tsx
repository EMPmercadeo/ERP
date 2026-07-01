'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, CheckSquare, Plus, Eye, FileText, ArrowRight } from 'lucide-react';
import { invoiceGroupedDeliveryNotes } from '@/lib/actions/delivery-notes';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
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

export interface DeliveryNoteData {
    id: string;
    numero: string;
    fechaEmision: string;
    fechaEntrega: string;
    totalNeto: number;
    estado: string;
    observaciones: string | null;
    clienteId: string;
    cliente: {
        razonSocial: string;
        ruc: string;
    };
    factura: {
        id: string;
        numero: string;
    } | null;
    itemsCount: number;
    itemsSummary: string;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function DeliveryNoteList({ initialData }: { initialData: DeliveryNoteData[] }) {
    const router = useRouter();
    const [notes, setNotes] = useState<DeliveryNoteData[]>(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [invoicedFilter, setInvoicedFilter] = useState('todas');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setNotes(initialData);
    }, [initialData]);

    if (!isMounted) return null;

    const filteredNotes = notes.filter((n) => {
        // Search term filter
        const matchesSearch = 
            n.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.cliente.ruc.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        // Status filter
        if (statusFilter !== 'todos' && n.estado !== statusFilter) {
            return false;
        }

        // Invoiced filter
        if (invoicedFilter === 'facturadas' && !n.factura && n.estado !== 'facturado') {
            return false;
        }
        if (invoicedFilter === 'no_facturadas' && (n.factura || n.estado === 'facturado')) {
            return false;
        }

        // Date range filter
        if (dateFrom && n.fechaEmision < dateFrom) {
            return false;
        }
        if (dateTo && n.fechaEmision > dateTo) {
            return false;
        }

        return true;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pending = filteredNotes.filter(n => n.estado !== 'facturado' && !n.factura).map(n => n.id);
            setSelectedIds(pending);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(item => item !== id));
        }
    };

    const handleGroupInvoice = async () => {
        if (selectedIds.length === 0) return;
        setIsSubmitting(true);
        try {
            const res = await invoiceGroupedDeliveryNotes(selectedIds);
            if (res.success) {
                toast.success(res.message);
                setNotes(notes.map(n => selectedIds.includes(n.id) ? { ...n, estado: 'facturado' } : n));
                setSelectedIds([]);
            } else {
                toast.error(res.message || 'Error al agrupar notas de entrega');
            }
        } catch (e: any) {
            toast.error(e.message || 'Error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ContentContainer>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notas de Entrega (Remisiones)</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Control de entregas, inventario y documentos relacionados
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <Button
                            onClick={handleGroupInvoice}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                        >
                            <CheckSquare className="h-4 w-4" />
                            Facturar {selectedIds.length} Agrupados
                        </Button>
                    )}
                    <Link href="/delivery-notes/new">
                        <Button className="bg-brand-1 text-white hover:bg-brand-1/90 gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            Nueva Nota de Entrega
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="mb-6 shadow-sm border-gray-200">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar número, cliente o RUC..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full"
                            />
                        </div>
                        <div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los estados</SelectItem>
                                    <SelectItem value="borrador">Borrador</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="parcialmente_entregado">Parcialmente entregado</SelectItem>
                                    <SelectItem value="entregado">Entregado</SelectItem>
                                    <SelectItem value="facturado">Facturado</SelectItem>
                                    <SelectItem value="anulado">Anulado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select value={invoicedFilter} onValueChange={setInvoicedFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Facturación" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas</SelectItem>
                                    <SelectItem value="facturadas">Facturadas</SelectItem>
                                    <SelectItem value="no_facturadas">No facturadas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="text-xs"
                                placeholder="Desde"
                            />
                            <span className="text-gray-400 text-xs">-</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="text-xs"
                                placeholder="Hasta"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/75">
                                    <TableHead className="w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            checked={selectedIds.length > 0 && selectedIds.length === filteredNotes.filter(n => n.estado !== 'facturado' && !n.factura).length}
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">Número</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Cliente</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Fecha de emisión</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Fecha de entrega</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Items</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Factura asociada</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Total</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-14 text-gray-500">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <FileText className="h-10 w-10 text-gray-300 mb-2" />
                                                <p className="font-medium text-gray-700 mb-1">No hay notas de entrega registradas.</p>
                                                <p className="text-sm text-gray-500">Crea una nota para documentar una entrega física a un cliente.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredNotes.map((note) => {
                                        const isFacturado = note.estado === 'facturado' || !!note.factura;
                                        return (
                                            <TableRow 
                                                key={note.id} 
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/delivery-notes/${note.id}`)}
                                            >
                                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    {!isFacturado && note.estado !== 'anulado' && (
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={selectedIds.includes(note.id)}
                                                            onChange={(e) => handleSelectOne(note.id, e.target.checked)}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-900">{note.numero}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-gray-900">{note.cliente.razonSocial}</div>
                                                    <div className="text-xs text-gray-500">RUC: {note.cliente.ruc}</div>
                                                </TableCell>
                                                <TableCell className="text-gray-600">{note.fechaEmision}</TableCell>
                                                <TableCell className="text-gray-600">{note.fechaEntrega}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-900 font-medium">{note.itemsCount} ítem{note.itemsCount !== 1 ? 's' : ''}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[160px]" title={note.itemsSummary}>
                                                        {note.itemsSummary}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={note.estado} />
                                                </TableCell>
                                                <TableCell>
                                                    {note.factura ? (
                                                        <span 
                                                            className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:underline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/invoices/${note.factura?.id}`);
                                                            }}
                                                        >
                                                            {note.factura.numero}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No facturada</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-gray-900">
                                                    {formatCurrency(note.totalNeto)}
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/delivery-notes/${note.id}`)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </ContentContainer>
    );
}
