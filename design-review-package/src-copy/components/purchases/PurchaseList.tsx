'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Search, Plus, Trash2, Calendar, FileText } from 'lucide-react';
import { deletePurchase } from '@/lib/actions/purchases';
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
import { NewPaymentModal } from './NewPaymentModal';

export interface PurchaseData {
    id: string;
    numeroFactura: string;
    fechaEmision: string;
    fechaVencimiento: string;
    totalNeto: number;
    saldoPendiente: number;
    estadoPago: string;
    observaciones: string | null;
    proveedorId: string;
    proveedor: {
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

const getInitials = (name: string) => {
    if (!name) return 'PR';
    return name
        .split(' ')
        .filter((w) => w[0] && /[a-zA-ZÁÉÍÓÚáéíóúÑñ]/.test(w[0]))
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
};

const palette = [
    'from-blue-600 to-indigo-400 text-white',
    'from-emerald-500 to-teal-400 text-white',
    'from-amber-500 to-orange-400 text-white',
    'from-purple-600 to-pink-400 text-white',
    'from-rose-500 to-red-400 text-white',
];

export function PurchaseList({ initialData }: { initialData: PurchaseData[] }) {
    const [isMounted, setIsMounted] = useState(false);
    const [search, setSearch] = useState('');
    const [purchases, setPurchases] = useState<PurchaseData[]>(initialData);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const filtered = purchases.filter(p => 
        p.numeroFactura.toLowerCase().includes(search.toLowerCase()) ||
        p.proveedor.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
        p.proveedor.ruc.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta compra? Se revertirá el inventario incrementado.')) {
            const res = await deletePurchase(id);
            if (res.success) {
                toast.success(res.message);
                setPurchases(purchases.filter(p => p.id !== id));
            } else {
                toast.error(res.error || 'Error al eliminar');
            }
        }
    };

    if (!isMounted) return null;

    return (
        <ContentContainer className="py-4 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Cuentas por Pagar (Compras)</h2>
                    <p className="text-muted-foreground text-sm">
                        Facturas de proveedores, gastos operativos y desembolsos
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild className="bg-brand-1 text-white hover:bg-brand-1/90">
                        <Link href="/purchases/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Factura de Compra
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por No. factura o proveedor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Factura No.</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>Fechas</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((p, idx) => {
                                        const gradClass = palette[idx % palette.length];
                                        const isPaid = p.saldoPendiente <= 0;
                                        return (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-mono font-bold text-slate-800">
                                                    #{p.numeroFactura}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br ${gradClass} shrink-0`}>
                                                            {getInitials(p.proveedor.razonSocial)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-foreground text-xs">{p.proveedor.razonSocial}</div>
                                                            <div className="text-[10px] text-muted-foreground font-mono">{p.proveedor.ruc}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono space-y-0.5">
                                                    <div>Emisión: {p.fechaEmision}</div>
                                                    <div className="text-slate-400">Vence: {p.fechaVencimiento}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        isPaid ? 'bg-emerald-100 text-emerald-800' :
                                                        p.estadoPago === 'parcial' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {isPaid ? 'Pagada' : p.estadoPago}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs font-semibold">
                                                    {formatCurrency(p.totalNeto)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    <span className={!isPaid ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                                                        {formatCurrency(p.saldoPendiente)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {!isPaid && (
                                                            <NewPaymentModal
                                                                compraId={p.id}
                                                                proveedorId={p.proveedorId}
                                                                numeroFactura={p.numeroFactura}
                                                                proveedorNombre={p.proveedor.razonSocial}
                                                                saldoPendiente={p.saldoPendiente}
                                                            />
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                                            No se encontraron facturas de compra.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="block md:hidden space-y-3">
                        {filtered.length > 0 ? (
                            filtered.map((p, idx) => {
                                const gradClass = palette[idx % palette.length];
                                const isPaid = p.saldoPendiente <= 0;
                                return (
                                    <div key={p.id} className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 space-y-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0`}>
                                                    {getInitials(p.proveedor.razonSocial)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{p.proveedor.razonSocial}</h4>
                                                    <p className="text-xs font-mono text-brand-1 font-bold">Fact. #{p.numeroFactura}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                    isPaid ? 'bg-emerald-100 text-emerald-800' :
                                                    p.estadoPago === 'parcial' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {isPaid ? 'Pagada' : p.estadoPago}
                                                </span>
                                                <p className="text-[10px] text-slate-400 font-mono mt-1">{p.fechaEmision}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-100/80 pt-2 text-xs">
                                            <div>
                                                <span className="text-slate-400 text-[10px] block">Total Factura</span>
                                                <span className="font-mono font-semibold text-slate-700">{formatCurrency(p.totalNeto)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-400 text-[10px] block">Por Pagar</span>
                                                <span className={`font-mono font-bold ${!isPaid ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {formatCurrency(p.saldoPendiente)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-1 border-t border-slate-100/80">
                                            {!isPaid && (
                                                <div className="flex-1">
                                                    <NewPaymentModal
                                                        compraId={p.id}
                                                        proveedorId={p.proveedorId}
                                                        numeroFactura={p.numeroFactura}
                                                        proveedorNombre={p.proveedor.razonSocial}
                                                        saldoPendiente={p.saldoPendiente}
                                                    />
                                                </div>
                                            )}
                                            <Button variant="outline" size="sm" className="h-8 px-3 text-red-500 rounded-lg shrink-0 ml-auto" onClick={() => handleDelete(p.id)}>
                                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                                No se encontraron facturas de compra.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </ContentContainer>
    );
}
