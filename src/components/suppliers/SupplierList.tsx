'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
    Search, 
    Trash2, 
    FileText, 
    DollarSign, 
    Building2, 
    Phone, 
    Mail, 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    MoreHorizontal, 
    User, 
    PlusCircle,
    Archive
} from 'lucide-react';
import { deleteSupplier, toggleSupplierStatus } from '@/lib/actions/suppliers';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { NewSupplierModal } from './NewSupplierModal';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SupplierData {
    id: string;
    tipoRuc: string;
    ruc: string;
    dv: string | null;
    razonSocial: string;
    nombreComercial: string | null;
    nombreContacto?: string | null;
    email: string | null;
    telefono: string | null;
    saldoPendiente: number;
    vencido?: number;
    ultimaCompra?: string | null;
    condicionPago: string;
    limiteCredito?: number | null;
    observaciones?: string | null;
    estado: string;
}

export interface SupplierSummary {
    totalPorPagar: number;
    saldoVencido: number;
    proximosVencimientos: number;
    proveedoresActivos: number;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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

export function SupplierList({ 
    initialData, 
    summary = { totalPorPagar: 0, saldoVencido: 0, proximosVencimientos: 0, proveedoresActivos: 0 } 
}: { 
    initialData: SupplierData[]; 
    summary?: SupplierSummary; 
}) {
    const [isMounted, setIsMounted] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [saldoFilter, setSaldoFilter] = useState('todos');
    const [termsFilter, setTermsFilter] = useState('todos');
    const [suppliers, setSuppliers] = useState<SupplierData[]>(initialData);

    useEffect(() => {
        setIsMounted(true);
        setSuppliers(initialData);
    }, [initialData]);

    const filtered = useMemo(() => {
        return suppliers.filter(s => {
            // Search filter
            const query = search.toLowerCase();
            const matchSearch = !query || 
                s.razonSocial.toLowerCase().includes(query) ||
                (s.nombreComercial && s.nombreComercial.toLowerCase().includes(query)) ||
                s.ruc.toLowerCase().includes(query) ||
                (s.dv && s.dv.toLowerCase().includes(query)) ||
                (s.email && s.email.toLowerCase().includes(query)) ||
                (s.telefono && s.telefono.toLowerCase().includes(query));

            if (!matchSearch) return false;

            // Status filter
            if (statusFilter !== 'todos' && s.estado !== statusFilter) {
                return false;
            }

            // Saldo filter
            if (saldoFilter === 'con_saldo' && s.saldoPendiente <= 0) return false;
            if (saldoFilter === 'con_vencido' && (!s.vencido || s.vencido <= 0)) return false;

            // Terms filter
            if (termsFilter !== 'todos' && s.condicionPago !== termsFilter) {
                return false;
            }

            return true;
        });
    }, [suppliers, search, statusFilter, saldoFilter, termsFilter]);

    const handleToggleStatus = async (id: string, nuevoEstado: string) => {
        const res = await toggleSupplierStatus(id, nuevoEstado);
        if (res.success) {
            toast.success(res.message);
            setSuppliers(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s));
        } else {
            toast.error(res.error || 'Error al cambiar estado');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas archivar/eliminar este proveedor?')) {
            const res = await deleteSupplier(id);
            if (res.success) {
                toast.success(res.message);
                setSuppliers(prev => prev.map(s => s.id === id ? { ...s, estado: 'archivado' } : s));
            } else {
                toast.error(res.error || 'Error al eliminar');
            }
        }
    };

    if (!isMounted) return null;

    return (
        <ContentContainer className="py-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Proveedores</h2>
                    <p className="text-muted-foreground text-sm">
                        Gestión de proveedores, facturas de compra, pagos y saldos pendientes
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <NewSupplierModal />
                </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total por Pagar</CardTitle>
                        <DollarSign className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalPorPagar)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Saldo acumulado en facturas vivas</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo Vencido</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.saldoVencido)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Facturas expiradas pendientes de pago</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Próximos Vencimientos</CardTitle>
                        <Calendar className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{formatCurrency(summary.proximosVencimientos)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Por vencer en próximos periodos</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proveedores Activos</CardTitle>
                        <Building2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{summary.proveedoresActivos}</div>
                        <p className="text-xs text-muted-foreground mt-1">De un total de {suppliers.length} registrados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table Card */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    {/* Filters Toolbar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, RUC, correo..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 bg-white h-9 text-xs"
                            />
                        </div>

                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="todos">Estado: Todos</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                                <option value="archivado">Archivados</option>
                                <option value="bloqueado">Bloqueados</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={saldoFilter}
                                onChange={(e) => setSaldoFilter(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="todos">Saldos: Todos</option>
                                <option value="con_saldo">Con Saldo Pendiente</option>
                                <option value="con_vencido">Con Saldo Vencido</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={termsFilter}
                                onChange={(e) => setTermsFilter(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="todos">Términos: Todos</option>
                                <option value="Contado">Contado</option>
                                <option value="Crédito 15 días">Crédito 15 días</option>
                                <option value="Crédito 30 días">Crédito 30 días</option>
                                <option value="Crédito 60 días">Crédito 60 días</option>
                            </select>
                        </div>
                    </div>

                    {/* Desktop Table (10 Columns) */}
                    <div className="hidden md:block rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100/80">
                                <TableRow>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>RUC / DV</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Teléfono / Correo</TableHead>
                                    <TableHead>Términos</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                                    <TableHead className="text-right">Vencido</TableHead>
                                    <TableHead>Última Compra</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((s, idx) => {
                                        const gradClass = palette[idx % palette.length];
                                        return (
                                            <TableRow key={s.id} className="hover:bg-slate-50/60">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0`}>
                                                            {getInitials(s.razonSocial)}
                                                        </div>
                                                        <div>
                                                            <Link href={`/suppliers/${s.id}`} className="font-semibold text-slate-800 hover:text-brand-1">
                                                                {s.razonSocial}
                                                            </Link>
                                                            {s.nombreComercial && <div className="text-[11px] text-muted-foreground">{s.nombreComercial}</div>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {s.ruc}{s.dv ? `-${s.dv}` : ''}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-slate-700">
                                                    {s.nombreContacto ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            {s.nombreContacto}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs space-y-0.5">
                                                    {s.email && <div className="flex items-center gap-1.5 text-slate-600"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /> {s.email}</div>}
                                                    {s.telefono && <div className="flex items-center gap-1.5 text-slate-600"><Phone className="h-3 w-3 text-muted-foreground shrink-0" /> {s.telefono}</div>}
                                                    {!s.email && !s.telefono && <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-slate-700">{s.condicionPago}</TableCell>
                                                <TableCell className="text-xs">
                                                    <Badge 
                                                        variant={
                                                            s.estado === 'activo' ? 'success' :
                                                            s.estado === 'inactivo' ? 'destructive' :
                                                            s.estado === 'bloqueado' ? 'destructive' : 'neutral'
                                                        }
                                                        className="capitalize font-medium text-[10px]"
                                                    >
                                                        {s.estado}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs">
                                                    <span className={s.saldoPendiente > 0 ? 'text-amber-600 font-bold' : 'text-slate-600 font-medium'}>
                                                        {formatCurrency(s.saldoPendiente)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs">
                                                    <span className={s.vencido && s.vencido > 0 ? 'text-red-600 font-bold' : 'text-slate-400 font-medium'}>
                                                        {formatCurrency(s.vencido || 0)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600">
                                                    {formatDate(s.ultimaCompra)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/suppliers/${s.id}?tab=info`} className="cursor-pointer">
                                                                    <FileText className="mr-2 h-4 w-4" /> Ver Detalle / Editar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/purchases/new?supplierId=${s.id}`} className="cursor-pointer">
                                                                    <PlusCircle className="mr-2 h-4 w-4 text-brand-1" /> Registrar Compra
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/suppliers/${s.id}?tab=payments`} className="cursor-pointer">
                                                                    <DollarSign className="mr-2 h-4 w-4 text-emerald-600" /> Registrar Pago
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/suppliers/${s.id}?tab=statement`} className="cursor-pointer">
                                                                    <Calendar className="mr-2 h-4 w-4 text-indigo-600" /> Estado de Cuenta
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {s.estado === 'activo' ? (
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(s.id, 'archivado')} className="text-amber-600 cursor-pointer">
                                                                    <Archive className="mr-2 h-4 w-4" /> Archivar proveedor
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(s.id, 'activo')} className="text-emerald-600 cursor-pointer">
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivar proveedor
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-red-600 cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar proveedor
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center text-sm text-muted-foreground">
                                            No se encontraron proveedores que coincidan con los filtros seleccionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards View */}
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

                                        {(s.email || s.telefono || s.nombreContacto) && (
                                            <div className="text-xs text-slate-600 space-y-1 bg-white p-2 rounded border border-slate-100">
                                                {s.nombreContacto && <div className="flex items-center gap-1.5 font-medium"><User className="h-3 w-3 text-muted-foreground shrink-0" /> {s.nombreContacto}</div>}
                                                {s.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /> {s.email}</div>}
                                                {s.telefono && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground shrink-0" /> {s.telefono}</div>}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/80">
                                            <span className="text-muted-foreground">Términos: <strong className="text-slate-700">{s.condicionPago}</strong></span>
                                            <Badge variant={s.estado === 'activo' ? 'success' : 'destructive'} className="text-[10px] capitalize">
                                                {s.estado}
                                            </Badge>
                                        </div>

                                        <div className="flex gap-2 pt-1">
                                            <Link href={`/suppliers/${s.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full h-9 text-xs font-bold text-brand-1 rounded-lg">
                                                    Ver Detalle / Estado Cuenta
                                                </Button>
                                            </Link>
                                            <Link href={`/purchases/new?supplierId=${s.id}`}>
                                                <Button variant="outline" size="icon" className="h-9 w-9 text-brand-1 rounded-lg shrink-0" title="Nueva compra">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </Link>
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
