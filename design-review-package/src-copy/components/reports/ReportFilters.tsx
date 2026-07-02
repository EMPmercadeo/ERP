'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    RotateCcw,
    Calendar,
    Search,
    X,
    Filter,
    FileSpreadsheet,
    FileText,
    Download,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    AlertCircle
} from 'lucide-react';
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfYear,
    endOfYear,
    format
} from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportFiltersProps {
    filterClients: { id: string; razonSocial: string }[];
    filterProducts: { id: string; descripcion: string; codigoInterno: string }[];
    filterSellers: { id: string; nombre: string }[];
    filterCompanies: { id: string; razonSocial: string }[];
    isSuperAdmin: boolean;
    currentFilters: {
        dateFrom: string;
        dateTo: string;
        clienteId: string;
        productoId: string;
        creadorId: string;
        estadoDgi: string;
        metodoPago: string;
        tipoDocumento: string;
        paymentStatus: string;
        periodoRapido: string;
        groupBy: 'day' | 'week' | 'month';
    };
    onExportExcel: () => void;
    onExportCSV: () => void;
}

export function ReportFilters({
    filterClients,
    filterProducts,
    filterSellers,
    filterCompanies,
    isSuperAdmin,
    currentFilters,
    onExportExcel,
    onExportCSV
}: ReportFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local filter states
    const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom);
    const [dateTo, setDateTo] = useState(currentFilters.dateTo);
    const [periodoRapido, setPeriodoRapido] = useState(currentFilters.periodoRapido);
    const [groupBy, setGroupBy] = useState(currentFilters.groupBy);
    const [clienteId, setClienteId] = useState(currentFilters.clienteId);
    const [productoId, setProductoId] = useState(currentFilters.productoId);
    const [creadorId, setCreadorId] = useState(currentFilters.creadorId);
    const [tipoDocumento, setTipoDocumento] = useState(currentFilters.tipoDocumento);
    const [estadoDgi, setEstadoDgi] = useState(currentFilters.estadoDgi);
    const [paymentStatus, setPaymentStatus] = useState(currentFilters.paymentStatus);
    const [metodoPago, setMetodoPago] = useState(currentFilters.metodoPago || 'all');

    // Advanced filters panel state
    const hasActiveAdvancedFilters = 
        currentFilters.tipoDocumento !== 'all' || 
        currentFilters.estadoDgi !== 'all' || 
        currentFilters.paymentStatus !== 'all' || 
        (currentFilters.metodoPago && currentFilters.metodoPago !== 'all') ||
        (isSuperAdmin && !!searchParams.get('x-impersonation'));
    
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(hasActiveAdvancedFilters);

    // Client Autocomplete states
    const [clientSearch, setClientSearch] = useState(
        currentFilters.clienteId !== 'all'
            ? filterClients.find(c => c.id === currentFilters.clienteId)?.razonSocial || ''
            : ''
    );
    const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
    const [clientLoading, setClientLoading] = useState(false);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientRef = useRef<HTMLDivElement>(null);

    // Product Autocomplete states
    const [productSearch, setProductSearch] = useState(
        currentFilters.productoId !== 'all'
            ? filterProducts.find(p => p.id === currentFilters.productoId)?.descripcion || ''
            : ''
    );
    const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
    const [productLoading, setProductLoading] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const productRef = useRef<HTMLDivElement>(null);

    // Debounced client search
    useEffect(() => {
        if (!clientSearch.trim()) {
            setClientSuggestions([]);
            return;
        }
        const selected = filterClients.find(c => c.id === clienteId);
        if (selected && selected.razonSocial === clientSearch) {
            return;
        }

        setClientLoading(true);
        const delayDebounce = setTimeout(async () => {
            try {
                const res = await fetch(`/api/customers/search?q=${encodeURIComponent(clientSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setClientSuggestions(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setClientLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [clientSearch, clienteId, filterClients]);

    // Debounced product search
    useEffect(() => {
        if (!productSearch.trim()) {
            setProductSuggestions([]);
            return;
        }
        const selected = filterProducts.find(p => p.id === productoId);
        if (selected && selected.descripcion === productSearch) {
            return;
        }

        setProductLoading(true);
        const delayDebounce = setTimeout(async () => {
            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(productSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setProductSuggestions(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setProductLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [productSearch, productoId, filterProducts]);

    // Close autocompletes on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (clientRef.current && !clientRef.current.contains(event.target as Node)) {
                setShowClientDropdown(false);
            }
            if (productRef.current && !productRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Quick period changes
    const handleQuickPeriodChange = (val: string) => {
        setPeriodoRapido(val);
        if (val === 'personalizado') return;

        const today = new Date();
        let from = today;
        let to = today;

        if (val === 'hoy') {
            from = startOfDay(today);
            to = endOfDay(today);
        } else if (val === 'semana') {
            from = startOfWeek(today, { weekStartsOn: 1 });
            to = endOfWeek(today, { weekStartsOn: 1 });
        } else if (val === 'mes') {
            from = startOfMonth(today);
            to = endOfMonth(today);
        } else if (val === 'mes_anterior') {
            const prevMonth = subMonths(today, 1);
            from = startOfMonth(prevMonth);
            to = endOfMonth(prevMonth);
        } else if (val === 'anio') {
            from = startOfYear(today);
            to = endOfYear(today);
        }

        setDateFrom(format(from, 'yyyy-MM-dd'));
        setDateTo(format(to, 'yyyy-MM-dd'));
    };

    const isDateRangeInvalid = !!(dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo));

    const handleApply = () => {
        if (isDateRangeInvalid) return;

        const params = new URLSearchParams();
        params.set('dateFrom', dateFrom);
        params.set('dateTo', dateTo);
        params.set('groupBy', groupBy);
        if (periodoRapido && periodoRapido !== 'personalizado') params.set('periodoRapido', periodoRapido);
        if (clienteId !== 'all') params.set('clienteId', clienteId);
        if (productoId !== 'all') params.set('productoId', productoId);
        if (creadorId !== 'all') params.set('creadorId', creadorId);
        if (tipoDocumento !== 'all') params.set('tipoDocumento', tipoDocumento);
        if (estadoDgi !== 'all') params.set('estadoDgi', estadoDgi);
        if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
        if (metodoPago !== 'all') params.set('metodoPago', metodoPago);
        
        // Retain super admin impersonation target if preset
        const impersonation = searchParams.get('x-impersonation');
        if (impersonation) params.set('x-impersonation', impersonation);

        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleReset = () => {
        setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
        setDateTo(format(endOfDay(new Date()), 'yyyy-MM-dd'));
        setPeriodoRapido('mes');
        setGroupBy('day');
        setClienteId('all');
        setProductoId('all');
        setCreadorId('all');
        setTipoDocumento('all');
        setEstadoDgi('all');
        setPaymentStatus('all');
        setMetodoPago('all');
        setClientSearch('');
        setProductSearch('');

        const params = new URLSearchParams();
        const impersonation = searchParams.get('x-impersonation');
        if (impersonation) params.set('x-impersonation', impersonation);
        
        router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const handleClearClient = () => {
        setClientSearch('');
        setClienteId('all');
        setClientSuggestions([]);
    };

    const handleClearProduct = () => {
        setProductSearch('');
        setProductoId('all');
        setProductSuggestions([]);
    };

    return (
        <Card className="bg-white shadow-sm border border-slate-100 rounded-xl overflow-visible">
            <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-x-4 lg:gap-y-3">
                    {/* FILA 1: Filtros Visibles Principales */}
                    
                    {/* Desde */}
                    <div className="space-y-1">
                        <Label htmlFor="dateFrom" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Desde</Label>
                        <div className="relative">
                            <Input
                                id="dateFrom"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setPeriodoRapido('personalizado');
                                }}
                                className={`h-10 text-xs sm:text-sm pl-9 pr-2 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full transition-colors ${
                                    isDateRangeInvalid ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/10' : ''
                                }`}
                            />
                            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDateRangeInvalid ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                    </div>

                    {/* Hasta */}
                    <div className="space-y-1">
                        <Label htmlFor="dateTo" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Hasta</Label>
                        <div className="relative">
                            <Input
                                id="dateTo"
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setPeriodoRapido('personalizado');
                                }}
                                className={`h-10 text-xs sm:text-sm pl-9 pr-2 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full transition-colors ${
                                    isDateRangeInvalid ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/10' : ''
                                }`}
                            />
                            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDateRangeInvalid ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                    </div>

                    {/* Agrupar gráfico */}
                    <div className="space-y-1">
                        <Label htmlFor="groupBy" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Agrupar gráfico</Label>
                        <Select value={groupBy} onValueChange={(val: any) => setGroupBy(val)}>
                            <SelectTrigger id="groupBy" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                <SelectValue placeholder="Agrupación" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="day" className="text-xs sm:text-sm cursor-pointer">Por Día</SelectItem>
                                <SelectItem value="week" className="text-xs sm:text-sm cursor-pointer">Por Semana</SelectItem>
                                <SelectItem value="month" className="text-xs sm:text-sm cursor-pointer">Por Mes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cliente Autocomplete */}
                    <div className="space-y-1 relative" ref={clientRef}>
                        <Label htmlFor="clienteSearch" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cliente</Label>
                        <div className="relative">
                            <Input
                                id="clienteSearch"
                                type="text"
                                placeholder="Buscar cliente..."
                                value={clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setShowClientDropdown(true);
                                    if (!e.target.value) {
                                        setClienteId('all');
                                    }
                                }}
                                onFocus={() => setShowClientDropdown(true)}
                                className="h-10 text-xs sm:text-sm pl-9 pr-8 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            {clientSearch && (
                                <button
                                    type="button"
                                    onClick={handleClearClient}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {showClientDropdown && (clientSuggestions.length > 0 || clientLoading) && (
                            <div className="absolute left-0 right-0 z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                {clientLoading ? (
                                    <div className="p-3 text-xs text-muted-foreground font-semibold">Buscando clientes...</div>
                                ) : (
                                    clientSuggestions.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setClientSearch(c.razonSocial);
                                                setClienteId(c.id);
                                                setShowClientDropdown(false);
                                            }}
                                            className="p-2.5 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                        >
                                            <div className="font-bold text-slate-800">{c.razonSocial}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">RUC: {c.ruc}{c.dv ? `-${c.dv}` : ''}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Producto Autocomplete */}
                    <div className="space-y-1 relative" ref={productRef}>
                        <Label htmlFor="productoSearch" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Producto</Label>
                        <div className="relative">
                            <Input
                                id="productoSearch"
                                type="text"
                                placeholder="Buscar producto..."
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setShowProductDropdown(true);
                                    if (!e.target.value) {
                                        setProductoId('all');
                                    }
                                }}
                                onFocus={() => setShowProductDropdown(true)}
                                className="h-10 text-xs sm:text-sm pl-9 pr-8 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            {productSearch && (
                                <button
                                    type="button"
                                    onClick={handleClearProduct}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {showProductDropdown && (productSuggestions.length > 0 || productLoading) && (
                            <div className="absolute left-0 right-0 z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                {productLoading ? (
                                    <div className="p-3 text-xs text-muted-foreground font-semibold">Buscando productos...</div>
                                ) : (
                                    productSuggestions.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setProductSearch(p.descripcion);
                                                setProductoId(p.id);
                                                setShowProductDropdown(false);
                                            }}
                                            className="p-2.5 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                        >
                                            <div className="font-bold text-slate-800">{p.descripcion}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Código: {p.codigoInterno}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Vendedor */}
                    <div className="space-y-1">
                        <Label htmlFor="creadorId" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Vendedor</Label>
                        <Select value={creadorId} onValueChange={setCreadorId}>
                            <SelectTrigger id="creadorId" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                <SelectValue placeholder="Vendedor" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos los vendedores</SelectItem>
                                {filterSellers.map((seller) => (
                                    <SelectItem key={seller.id} value={seller.id} className="text-xs sm:text-sm cursor-pointer">
                                        {seller.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* FILA 2: Filtros Avanzados (Condicionales Colapsables) */}
                    {isAdvancedExpanded && (
                        <>
                            {/* Periodo Rápido */}
                            <div className="space-y-1">
                                <Label htmlFor="periodoRapido" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Periodo rápido</Label>
                                <Select value={periodoRapido} onValueChange={handleQuickPeriodChange}>
                                    <SelectTrigger id="periodoRapido" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Periodo rápido" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="hoy" className="text-xs sm:text-sm cursor-pointer">Hoy</SelectItem>
                                        <SelectItem value="semana" className="text-xs sm:text-sm cursor-pointer">Esta semana</SelectItem>
                                        <SelectItem value="mes" className="text-xs sm:text-sm cursor-pointer">Este mes</SelectItem>
                                        <SelectItem value="mes_anterior" className="text-xs sm:text-sm cursor-pointer">Mes anterior</SelectItem>
                                        <SelectItem value="anio" className="text-xs sm:text-sm cursor-pointer">Este año</SelectItem>
                                        <SelectItem value="personalizado" className="text-xs sm:text-sm cursor-pointer">Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tipo Documento */}
                            <div className="space-y-1">
                                <Label htmlFor="tipoDocumento" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tipo de Documento</Label>
                                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                                    <SelectTrigger id="tipoDocumento" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos los tipos</SelectItem>
                                        <SelectItem value="FE" className="text-xs sm:text-sm cursor-pointer">Factura Electrónica (FE)</SelectItem>
                                        <SelectItem value="NC" className="text-xs sm:text-sm cursor-pointer">Nota de Crédito (NC)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Estado DGI */}
                            <div className="space-y-1">
                                <Label htmlFor="estadoDgi" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estado DGI</Label>
                                <Select value={estadoDgi} onValueChange={setEstadoDgi}>
                                    <SelectTrigger id="estadoDgi" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Estado DGI" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos los estados</SelectItem>
                                        <SelectItem value="borrador" className="text-xs sm:text-sm cursor-pointer">Borrador</SelectItem>
                                        <SelectItem value="pendiente" className="text-xs sm:text-sm cursor-pointer">Pendiente DGI</SelectItem>
                                        <SelectItem value="aceptada" className="text-xs sm:text-sm cursor-pointer">Aceptada</SelectItem>
                                        <SelectItem value="rechazada" className="text-xs sm:text-sm cursor-pointer">Rechazada</SelectItem>
                                        <SelectItem value="anulada" className="text-xs sm:text-sm cursor-pointer">Anulada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Estado Pago */}
                            <div className="space-y-1">
                                <Label htmlFor="paymentStatus" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estado de Pago</Label>
                                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                    <SelectTrigger id="paymentStatus" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Estado de Pago" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos los estados</SelectItem>
                                        <SelectItem value="pagada" className="text-xs sm:text-sm cursor-pointer">Pagada</SelectItem>
                                        <SelectItem value="pendiente" className="text-xs sm:text-sm cursor-pointer">Pendiente</SelectItem>
                                        <SelectItem value="parcial" className="text-xs sm:text-sm cursor-pointer">Parcial</SelectItem>
                                        <SelectItem value="vencida" className="text-xs sm:text-sm cursor-pointer">Vencida</SelectItem>
                                        <SelectItem value="anulada" className="text-xs sm:text-sm cursor-pointer">Anulada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Método de Pago */}
                            <div className="space-y-1">
                                <Label htmlFor="metodoPago" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Método de Pago</Label>
                                <Select value={metodoPago} onValueChange={setMetodoPago}>
                                    <SelectTrigger id="metodoPago" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                        <SelectValue placeholder="Método de pago" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Todos los métodos</SelectItem>
                                        <SelectItem value="efectivo" className="text-xs sm:text-sm cursor-pointer">Efectivo</SelectItem>
                                        <SelectItem value="transferencia" className="text-xs sm:text-sm cursor-pointer">Transferencia</SelectItem>
                                        <SelectItem value="tarjeta" className="text-xs sm:text-sm cursor-pointer">Tarjeta</SelectItem>
                                        <SelectItem value="cheque" className="text-xs sm:text-sm cursor-pointer">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Empresa / Tenant (Visibilidad condicionada a Super Admin) */}
                            <div className="space-y-1">
                                <Label htmlFor="empresaFilter" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Empresa / Tenant</Label>
                                {isSuperAdmin ? (
                                    <Select
                                        value={searchParams.get('x-impersonation') || 'all'}
                                        onValueChange={(val) => {
                                            const params = new URLSearchParams(searchParams.toString());
                                            if (val === 'all') {
                                                params.delete('x-impersonation');
                                            } else {
                                                params.set('x-impersonation', val);
                                            }
                                            router.push(`${pathname}?${params.toString()}`);
                                        }}
                                    >
                                        <SelectTrigger id="empresaFilter" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                            <SelectValue placeholder="Empresa impersonada" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer">Empresa principal (Default)</SelectItem>
                                            {filterCompanies.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id} className="text-xs sm:text-sm cursor-pointer">
                                                    {emp.razonSocial}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id="empresaFilter"
                                        type="text"
                                        value="Locked Tenant Context"
                                        disabled
                                        className="h-10 text-xs sm:text-sm bg-slate-100 border-slate-200 text-slate-400 font-semibold rounded-lg w-full cursor-not-allowed"
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {/* Alerta de validación de fechas (si la inicial es mayor que la final) */}
                    {isDateRangeInvalid && (
                        <div className="col-span-1 sm:col-span-3 lg:col-span-6 flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100 transition-all">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                            <span>La fecha inicial (Desde) no puede ser posterior a la fecha final (Hasta).</span>
                        </div>
                    )}

                    {/* FILA DE ACCIONES: Alineados en la misma grilla en Desktop, auto-flex en Tablet y Móvil */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2.5 w-full lg:grid lg:grid-cols-6 lg:gap-x-4 col-span-1 sm:col-span-3 lg:col-span-6 mt-1">
                        {/* Marcador de posición de columnas vacías para alineación perfecta en desktop */}
                        <div className="hidden lg:block lg:col-span-2"></div>
                        
                        {/* Botón Más filtros */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                            className="h-10 text-xs font-bold text-slate-600 border-slate-200 rounded-lg w-full flex items-center justify-center gap-1.5 transition-all hover:bg-slate-50 shrink-0 lg:col-span-1"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                            <span>{isAdvancedExpanded ? 'Menos filtros' : 'Más filtros'}</span>
                            {isAdvancedExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                        </Button>

                        {/* Botón Exportar */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild id="export-report-trigger">
                                <Button
                                    variant="outline"
                                    className="h-10 text-xs font-bold text-slate-600 border-slate-200 rounded-lg w-full flex items-center justify-center gap-1.5 transition-all hover:bg-slate-50 shrink-0 lg:col-span-1"
                                >
                                    <Download className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Exportar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-md border-slate-200">
                                <DropdownMenuLabel className="text-xs font-bold text-slate-500 px-3 py-2">Formatos de Exportación</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer text-xs font-semibold py-2 hover:bg-slate-50">
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                    Reporte Excel (.xlsx)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer text-xs font-semibold py-2 hover:bg-slate-50">
                                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                    Detalle CSV (.csv)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Botón Limpiar */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            className="h-10 text-xs font-bold text-slate-600 border-slate-200 rounded-lg w-full flex items-center justify-center gap-1.5 transition-all hover:bg-slate-50 shrink-0 lg:col-span-1"
                        >
                            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                            <span>Limpiar</span>
                        </Button>

                        {/* Botón Aplicar */}
                        <Button
                            type="button"
                            onClick={handleApply}
                            disabled={isDateRangeInvalid}
                            className={`h-10 text-xs font-bold text-white rounded-lg w-full flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 lg:col-span-1 ${
                                isDateRangeInvalid 
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                                : 'bg-brand-1 hover:bg-brand-2 active:scale-95'
                            }`}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            <span>Aplicar</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
