'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, FileText, CheckSquare, Plus } from 'lucide-react';
import { invoiceGroupedDeliveryNotes, updateDeliveryNoteStatus } from '@/lib/actions/delivery-notes';
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

export interface DeliveryNoteData {
    id: string;
    numero: string;
    fechaEmision: string;
    totalNeto: number;
    estado: string;
    observaciones: string | null;
    clienteId: string;
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

export function DeliveryNoteList({ initialData }: { initialData: DeliveryNoteData[] }) {
    const router = useRouter();
    const [notes, setNotes] = useState<DeliveryNoteData[]>(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setNotes(initialData);
    }, [initialData]);

    if (!isMounted) return null;

    const filteredNotes = notes.filter((n) =>
        n.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.cliente.ruc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pending = filteredNotes.filter(n => n.estado !== 'facturado').map(n => n.id);
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
                toast.error(res.message || 'Error al agrupar albaranes');
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Albaranes de Venta (Remisiones)</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Control de entregas físicas, rebaja inmediata de stock y facturación por agrupación
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
                            Nuevo Albarán
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
                                    <TableHead className="w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            checked={selectedIds.length > 0 && selectedIds.length === filteredNotes.filter(n => n.estado !== 'facturado').length}
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">Número</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Cliente</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Emisión</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Total Neto</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                            No se encontraron albaranes registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredNotes.map((note) => {
                                        const isFacturado = note.estado === 'facturado';
                                        return (
                                            <TableRow 
                                                key={note.id} 
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/delivery-notes/${note.id}`)}
                                            >
                                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    {!isFacturado && (
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
                                                <TableCell className="text-right font-semibold text-gray-900">
                                                    {formatCurrency(note.totalNeto)}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        status={note.estado}
                                                    />
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
