'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Trash2, FileText, DollarSign, Building2, Phone, Mail } from 'lucide-react';
import { deleteSupplier } from '@/lib/actions/suppliers';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { NewSupplierModal } from './NewSupplierModal';

export interface SupplierData {
    id: string;
    tipoRuc: string;
    ruc: string;
    dv: string | null;
    razonSocial: string;
    nombreComercial: string | null;
    email: string | null;
    telefono: string | null;
    saldoPendiente: number;
    condicionPago: string;
    estado: string;
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
    'from-indigo-600 to-purple-400 text-white',
    'from-emerald-500 to-teal-400 text-white',
    'from-amber-500 to-orange-400 text-white',
    'from-blue-600 to-cyan-400 text-white',
    'from-rose-500 to-red-400 text-white',
];

export function SupplierList({ initialData }: { initialData: SupplierData[] }) {
    const [search, setSearch] = useState('');
    const [suppliers, setSuppliers] = useState<SupplierData[]>(initialData);

    const filtered = suppliers.filter(s => 
        s.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
        s.ruc.toLowerCase().includes(search.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
            const res = await deleteSupplier(id);
            if (res.success) {
                toast.success(res.message);
                setSuppliers(suppliers.filter(s => s.id !== id));
            } else {
                toast.error(res.error || 'Error al eliminar');
            }
        }
    };

    return (
        <ContentContainer className="py-4 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gestión de Proveedores</h2>
                    <p className="text-muted-foreground text-sm">
                        Directorio de cuentas por pagar y saldos pendientes (Peachtree)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <NewSupplierModal />
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar proveedor por razón social o RUC..."
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
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>RUC / DV</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Términos</TableHead>
                                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((s, idx) => {
                                        const gradClass = palette[idx % palette.length];
                                        return (
                                            <TableRow key={s.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0`}>
                                                            {getInitials(s.razonSocial)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-foreground">{s.razonSocial}</div>
                                                            {s.nombreComercial && <div className="text-xs text-muted-foreground">{s.nombreComercial}</div>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {s.ruc}{s.dv ? `-${s.dv}` : ''}
                                                </TableCell>
                                                <TableCell className="text-xs space-y-0.5">
                                                    {s.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" /> {s.email}</div>}
                                                    {s.telefono && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" /> {s.telefono}</div>}
                                                </TableCell>
                                                <TableCell className="text-xs">{s.condicionPago}</TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    <span className={s.saldoPendiente > 0 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                                                        {formatCurrency(s.saldoPendiente)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/purchases?proveedorId=${s.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-brand-1">
                                                                <FileText className="mr-1 h-3.5 w-3.5" />
                                                                Compras
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(s.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                                            No se encontraron proveedores registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="block md:hidden space-y-3">
                        {filtered.length > 0 ? (
                            filtered.map((s, idx) => {
                                const gradClass = palette[idx % palette.length];
                                return (
                                    <div key={s.id} className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 space-y-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0`}>
                                                    {getInitials(s.razonSocial)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{s.razonSocial}</h4>
                                                    <p className="text-xs font-mono text-muted-foreground">{s.ruc}{s.dv ? `-${s.dv}` : ''}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-muted-foreground block">Saldo Pendiente</span>
                                                <span className={`font-mono font-bold text-sm ${s.saldoPendiente > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                    {formatCurrency(s.saldoPendiente)}
                                                </span>
                                            </div>
                                        </div>

                                        {(s.email || s.telefono) && (
                                            <div className="text-xs text-slate-600 space-y-1 bg-white p-2 rounded border border-slate-100">
                                                {s.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /> {s.email}</div>}
                                                {s.telefono && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground shrink-0" /> {s.telefono}</div>}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-1 border-t border-slate-100/80">
                                            <Link href={`/purchases?proveedorId=${s.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full h-9 text-xs font-bold text-brand-1 rounded-lg">
                                                    Ver Compras / Facturas
                                                </Button>
                                            </Link>
                                            <Button variant="outline" size="icon" className="h-9 w-9 text-red-500 rounded-lg shrink-0" onClick={() => handleDelete(s.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                                No se encontraron proveedores registrados.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </ContentContainer>
    );
}
