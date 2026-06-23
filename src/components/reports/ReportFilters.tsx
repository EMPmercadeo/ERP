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
    User,
    Tag,
    Receipt,
    Coins,
    Briefcase,
    ChevronDown,
    X,
    Filter,
    FileSpreadsheet,
    FileText,
    Download
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

    // Local filter states (applying filters only on click "Aplicar")
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

    const handleApply = () => {
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
        setClientSearch('');
        setProductSearch('');
        router.push(pathname);
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
        <Card className="bg-white shadow-sm border border-slate-100 rounded-xl">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                    <Filter className="h-4.5 w-4.5 text-brand-1" />
                    <h3 className="text-sm font-bold text-foreground">Filtros del reporte</h3>
                </div>

                <div className="space-y-6">
                    {/* Grupo 1: Periodo */}
                    <div className="space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Periodo</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="periodoRapido" className="text-xs font-semibold text-slate-500">Periodo rápido</Label>
                                <Select value={periodoRapido} onValueChange={handleQuickPeriodChange}>
                                    <SelectTrigger id="periodoRapido" className="h-9 text-sm bg-slate-50/50 border-slate-200">
                                        <SelectValue placeholder="Periodo rápido" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hoy">Hoy</SelectItem>
                                        <SelectItem value="semana">Esta semana</SelectItem>
                                        <SelectItem value="mes">Este mes</SelectItem>
                                        <SelectItem value="mes_anterior">Mes anterior</SelectItem>
                                        <SelectItem value="anio">Este año</SelectItem>
                                        <SelectItem value="personalizado">Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dateFrom" className="text-xs font-semibold text-slate-500">Desde</Label>
                                <div className="relative">
                                    <Input
                                        id="dateFrom"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => {
                                            setDateFrom(e.target.value);
                                            setPeriodoRapido('personalizado');
                                        }}
                                        className="h-9 text-sm pl-9 bg-slate-50/50 border-slate-200"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dateTo" className="text-xs font-semibold text-slate-500">Hasta</Label>
                                <div className="relative">
                                    <Input
                                        id="dateTo"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => {
                                            setDateTo(e.target.value);
                                            setPeriodoRapido('personalizado');
                                        }}
                                        className="h-9 text-sm pl-9 bg-slate-50/50 border-slate-200"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="groupBy" className="text-xs font-semibold text-slate-500">Agrupar gráfico</Label>
                                <Select value={groupBy} onValueChange={(val: any) => setGroupBy(val)}>
                                    <SelectTrigger id="groupBy" className="h-9 text-sm bg-slate-50/50 border-slate-200">
                                        <SelectValue placeholder="Agrupación" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Por Día</SelectItem>
                                        <SelectItem value="week">Por Semana</SelectItem>
                                        <SelectItem value="month">Por Mes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Grupo 2: Datos Comerciales */}
                    <div className="space-y-3 pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Datos comerciales</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Cliente Autocomplete Input */}
                            <div className="space-y-1.5 relative" ref={clientRef}>
                                <Label htmlFor="clienteSearch" className="text-xs font-semibold text-slate-500">Cliente</Label>
                                <div className="relative">
                                    <Input
                                        id="clienteSearch"
                                        type="text"
                                        placeholder="Buscar por nombre, RUC, correo..."
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientDropdown(true);
                                            if (!e.target.value) {
                                                setClienteId('all');
                                            }
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        className="h-9 text-sm pl-9 pr-8 bg-slate-50/50 border-slate-200"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    {clientSearch && (
                                        <button
                                            type="button"
                                            onClick={handleClearClient}
                                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                {showClientDropdown && (clientSuggestions.length > 0 || clientLoading) && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
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
                                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">RUC: {c.ruc}{c.dv ? `-${c.dv}` : ''} {c.email ? `· ${c.email}` : ''}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Producto Autocomplete Input */}
                            <div className="space-y-1.5 relative" ref={productRef}>
                                <Label htmlFor="productoSearch" className="text-xs font-semibold text-slate-500">Producto / Servicio</Label>
                                <div className="relative">
                                    <Input
                                        id="productoSearch"
                                        type="text"
                                        placeholder="Buscar por nombre, código SKU..."
                                        value={productSearch}
                                        onChange={(e) => {
                                            setProductSearch(e.target.value);
                                            setShowProductDropdown(true);
                                            if (!e.target.value) {
                                                setProductoId('all');
                                            }
                                        }}
                                        onFocus={() => setShowProductDropdown(true)}
                                        className="h-9 text-sm pl-9 pr-8 bg-slate-50/50 border-slate-200"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    {productSearch && (
                                        <button
                                            type="button"
                                            onClick={handleClearProduct}
                                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                {showProductDropdown && (productSuggestions.length > 0 || productLoading) && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
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
                                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Código: {p.codigoInterno} · Stock: {p.stockActual}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Vendedor Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="creadorId" className="text-xs font-semibold text-slate-500">Vendedor</Label>
                                <Select value={creadorId} onValueChange={setCreadorId}>
                                    <SelectTrigger id="creadorId" className="h-9 text-sm bg-slate-50/50 border-slate-200">
                                        <SelectValue placeholder="Seleccione Vendedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los vendedores</SelectItem>
                                        {filterSellers.map((seller) => (
                                            <SelectItem key={seller.id} value={seller.id}>
                                                {seller.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Grupo 3: Datos Fiscales */}
                    <div className="space-y-3 pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Datos fiscales / documento</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Tipo Documento */}
                            <div className="space-y-1.5">
                                <Label htmlFor="tipoDocumento" className="text-xs font-semibold text-slate-500">Tipo de Documento</Label>
                                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                                    <SelectTrigger id="tipoDocumento" className="h-9 text-sm bg-slate-50/50 border-slate-200">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        <SelectItem value="FE">Factura Electrónica (FE)</SelectItem>
                                        <SelectItem value="NC">Nota de Crédito (NC)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Estado DGI */}
                            <div className="space-y-1.5">
                                <Label htmlFor="estadoDgi" className="text-xs font-semibold text-slate-500">Estado DGI</Label>
                                <Select value={estadoDgi} onValueChange={setEstadoDgi}>
                                    <SelectTrigger id="estadoDgi" className="h-9 text-sm bg-slate-50/50 border-slate-200">
                                        <SelectValue placeholder="Estado DGI" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="borrador">Borrador</SelectItem>
                                        <SelectItem value="pendiente">Pendiente DGI</SelectItem>
                                        <SelectItem value="aceptada">Aceptada</SelectItem>
                                        <SelectItem value="rechazada">Rechazada</SelectItem>
                                        <SelectItem value="anulada">Anulada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Estado de Pago */}
                            <div className="space-y-1.5">
                                <Label htmlFor="paymentStatus" className="text-xs font-semibold text-slate-500">Estado de Pago</Label>
                                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                    <SelectTrigger id="paymentStatus" className="h-9 text-sm bg-slate-50/50 border-slate-200">
                                        <SelectValue placeholder="Estado de Pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="pagada">Pagada</SelectItem>
                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                        <SelectItem value="parcial">Parcial</SelectItem>
                                        <SelectItem value="vencida">Vencida</SelectItem>
                                        <SelectItem value="anulada">Anulada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Empresa (Visible for Super Admin) */}
                            <div className="space-y-1.5">
                                <Label htmlFor="empresaFilter" className="text-xs font-semibold text-slate-500">Empresa / Tenant</Label>
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
                                        <SelectTrigger id="empresaFilter" className="h-9 text-sm bg-slate-50/50 border-slate-200">
                                            <SelectValue placeholder="Empresa impersonada" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Empresa principal (Default)</SelectItem>
                                            {filterCompanies.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
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
                                        className="h-9 text-sm bg-slate-100 border-slate-200 text-slate-400 font-semibold"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fila Final: Acciones a la Derecha */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="h-9 font-semibold text-xs text-slate-600 order-2 sm:order-none"
                    >
                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                        Limpiar filtros
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild id="export-report-trigger">
                            <Button variant="outline" className="h-9 gap-2 font-semibold text-xs border-slate-200">
                                <Download className="h-4 w-4" />
                                Exportar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Formatos de Exportación</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
                                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                Reporte Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                Detalle CSV (.csv)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        onClick={handleApply}
                        className="h-9 px-5 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs shadow-sm order-1 sm:order-none"
                    >
                        <Filter className="mr-2 h-3.5 w-3.5" />
                        Aplicar filtros
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
