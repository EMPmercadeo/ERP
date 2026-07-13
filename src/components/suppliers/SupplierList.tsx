'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Search,
    Trash2,
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
    Archive,
    Edit,
    Eye,
    Send
} from 'lucide-react';
import { deleteSupplier, toggleSupplierStatus, getSuppliersWithSummary, sendSupplierEmailAction } from '@/lib/actions/suppliers';
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
import { EditSupplierModal } from './EditSupplierModal';
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
    'from-brand-1 to-brand-2 text-white',
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
    const [summaryState, setSummaryState] = useState<SupplierSummary>(summary);
    const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
        if (initialData && initialData.length > 0) {
            setSuppliers(initialData);
        }
        if (summary) {
            setSummaryState(summary);
        }

        // Siempre obtener la lista y resumen más recientes en el cliente al montar el componente
        getSuppliersWithSummary().then((res) => {
            if (res && res.success && res.suppliers) {
                setSuppliers(res.suppliers);
                if (res.summary) {
                    setSummaryState(res.summary);
                }
            }
        });
    }, [initialData, summary]);

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
            if (statusFilter !== 'todos' && s.estado !== statusFilter) return false;

            // Saldo filter
            if (saldoFilter === 'con_saldo' && s.saldoPendiente <= 0) return false;
            if (saldoFilter === 'sin_saldo' && s.saldoPendiente > 0) return false;
            if (saldoFilter === 'con_vencido' && (!s.vencido || s.vencido <= 0)) return false;

            // Terms filter
            if (termsFilter !== 'todos' && s.condicionPago !== termsFilter) return false;

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

    const handleSendEmail = async (s: SupplierData, tipo: 'estado_cuenta' | 'orden_compra' = 'estado_cuenta') => {
        toast.promise(sendSupplierEmailAction(s.id, s.email || '', tipo), {
            loading: `Generando y enviando PDF de estado de cuenta a ${s.email || s.razonSocial}...`,
            success: (data) => {
                if (data.success) return data.message;
                throw new Error(data.error);
            },
            error: (err) => err?.message || 'Error al enviar correo'
        });
    };

    if (!isMounted) return null;

    return (
        <ContentContainer className="py-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Proveedores</h2>
                    <p className="text-muted-foreground text-sm">
                        Catálogo oficial de proveedores, facturas de compra, pagos y saldos pendientes
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <NewSupplierModal />
                </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total por Pagar</CardTitle>
                        <DollarSign className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(summaryState.totalPorPagar)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Saldo acumulado en facturas vivas</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo Vencido</CardTitle>
                        <AlertCircle className="h-4 w-4 text-danger" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-danger">{formatCurrency(summaryState.saldoVencido)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Facturas expiradas pendientes de pago</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Próximos Vencimientos</CardTitle>
                        <Calendar className="h-4 w-4 text-brand-1" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-1">{formatCurrency(summaryState.proximosVencimientos)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Por vencer en próximos periodos</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proveedores Activos</CardTitle>
                        <Building2 className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{summaryState.proveedoresActivos}</div>
                        <p className="text-xs text-muted-foreground mt-1">De un total de {suppliers.length} registrados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table Card */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    {/* Filters Toolbar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-muted/70 p-3.5 rounded-xl border border-border/80">
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
                            <TableHeader className="bg-muted/80">
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
                                            <TableRow key={s.id} className="hover:bg-accent/60">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0`}>
                                                            {getInitials(s.razonSocial)}
                                                        </div>
                                                        <div>
                                                            <Link href={`/suppliers/${s.id}`} className="font-semibold text-foreground hover:text-brand-1">
                                                                {s.razonSocial}
                                                            </Link>
                                                            {s.nombreComercial && <div className="text-[11px] text-muted-foreground">{s.nombreComercial}</div>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {s.ruc}{s.dv ? `-${s.dv}` : ''}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-foreground">
                                                    {s.nombreContacto ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            {s.nombreContacto}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs space-y-0.5">
                                                    {s.email && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /> {s.email}</div>}
                                                    {s.telefono && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3 text-muted-foreground shrink-0" /> {s.telefono}</div>}
                                                    {!s.email && !s.telefono && <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-foreground">{s.condicionPago}</TableCell>
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
                                                    <span className={s.saldoPendiente > 0 ? 'text-warning font-bold' : 'text-muted-foreground font-medium'}>
                                                        {formatCurrency(s.saldoPendiente)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs">
                                                    <span className={s.vencido && s.vencido > 0 ? 'text-danger font-bold' : 'text-muted-foreground font-medium'}>
                                                        {formatCurrency(s.vencido || 0)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {formatDate(s.ultimaCompra)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/suppliers/${s.id}?tab=info`}>
                                                            <Button variant="ghost" size="icon" aria-label="Ver detalle" className="h-8 w-8 text-muted-foreground hover:text-brand-1 hover:bg-brand-1/10" title="Ver Detalle">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Editar proveedor"
                                                            className="h-8 w-8 text-muted-foreground hover:text-warning hover:bg-warning-bg"
                                                            title="Editar Proveedor"
                                                            onClick={() => setEditingSupplier(s)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Enviar estado de cuenta al correo"
                                                            className="h-8 w-8 text-muted-foreground hover:text-success hover:bg-success-bg"
                                                            title="Enviar Estado de Cuenta al Correo"
                                                            onClick={() => handleSendEmail(s, 'estado_cuenta')}
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Abrir menú</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56">
                                                                <DropdownMenuLabel>Acciones del Proveedor</DropdownMenuLabel>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/suppliers/${s.id}?tab=info`} className="cursor-pointer">
                                                                        <Eye className="mr-2 h-4 w-4 text-brand-1" /> Ver Perfil Comercial
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setEditingSupplier(s)} className="cursor-pointer">
                                                                    <Edit className="mr-2 h-4 w-4 text-warning" /> Editar Datos
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleSendEmail(s, 'estado_cuenta')} className="cursor-pointer">
                                                                    <Send className="mr-2 h-4 w-4 text-success" /> Enviar Estado de Cuenta
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/purchases/new?supplierId=${s.id}`} className="cursor-pointer">
                                                                        <PlusCircle className="mr-2 h-4 w-4 text-brand-1" /> Registrar Nueva Compra
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/suppliers/${s.id}?tab=payments`} className="cursor-pointer">
                                                                        <DollarSign className="mr-2 h-4 w-4 text-success" /> Registrar Pago
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {s.estado === 'activo' ? (
                                                                    <DropdownMenuItem onClick={() => handleToggleStatus(s.id, 'archivado')} className="text-warning cursor-pointer">
                                                                        <Archive className="mr-2 h-4 w-4" /> Archivar proveedor
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => handleToggleStatus(s.id, 'activo')} className="text-success cursor-pointer">
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivar proveedor
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive cursor-pointer">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar proveedor
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
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
                                    <div key={s.id} className="bg-muted/60 border border-border rounded-xl p-3.5 space-y-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${gradClass} shrink-0`}>
                                                    {getInitials(s.razonSocial)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-foreground text-sm truncate">{s.razonSocial}</h4>
                                                    <p className="text-xs font-mono text-muted-foreground">{s.ruc}{s.dv ? `-${s.dv}` : ''}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-muted-foreground block">Saldo Pendiente</span>
                                                <span className={`font-mono font-bold text-sm ${s.saldoPendiente > 0 ? 'text-warning' : 'text-foreground'}`}>
                                                    {formatCurrency(s.saldoPendiente)}
                                                </span>
                                            </div>
                                        </div>

                                        {(s.email || s.telefono || s.nombreContacto) && (
                                            <div className="text-xs text-muted-foreground space-y-1 bg-card p-2 rounded border border-border">
                                                {s.nombreContacto && <div className="flex items-center gap-1.5 font-medium"><User className="h-3 w-3 text-muted-foreground shrink-0" /> {s.nombreContacto}</div>}
                                                {s.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /> {s.email}</div>}
                                                {s.telefono && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground shrink-0" /> {s.telefono}</div>}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/80">
                                            <span className="text-muted-foreground">Términos: <strong className="text-foreground">{s.condicionPago}</strong></span>
                                            <Badge variant={s.estado === 'activo' ? 'success' : 'destructive'} className="text-[10px] capitalize">
                                                {s.estado}
                                            </Badge>
                                        </div>

                                        <div className="flex gap-2 pt-1">
                                            <Link href={`/suppliers/${s.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full h-9 text-xs font-bold text-brand-1 rounded-lg">
                                                    Ver Detalle
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                aria-label="Editar proveedor"
                                                className="h-9 w-9 text-warning rounded-lg shrink-0"
                                                title="Editar"
                                                onClick={() => setEditingSupplier(s)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                aria-label="Enviar correo"
                                                className="h-9 w-9 text-success rounded-lg shrink-0"
                                                title="Enviar Correo"
                                                onClick={() => handleSendEmail(s, 'estado_cuenta')}
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                            <Link href={`/purchases/new?supplierId=${s.id}`}>
                                                <Button variant="outline" size="icon" aria-label="Nueva compra" className="h-9 w-9 text-brand-1 rounded-lg shrink-0" title="Nueva compra">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center text-xs text-muted-foreground font-semibold">
                                No se encontraron proveedores registrados.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {editingSupplier && (
                <EditSupplierModal
                    supplier={editingSupplier}
                    open={!!editingSupplier}
                    onOpenChange={(open) => {
                        if (!open) setEditingSupplier(null);
                    }}
                    onSuccess={(updated) => {
                        setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
                    }}
                />
            )}
        </ContentContainer>
    );
}
