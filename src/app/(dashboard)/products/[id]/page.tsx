'use client';

import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Loader2,
    Package,
    History,
    Calculator,
    Copy,
    Warehouse,
    ImageIcon,
    Percent,
    AlertCircle,
    User,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    CheckCircle2,
    CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { updateProduct, getProduct } from '@/lib/actions/products';
import { useState, useEffect, use, useActionState } from 'react';
import { cn } from '@/lib/utils';

const initialState = {
    message: '',
    errors: {} as Record<string, string[] | undefined>,
    success: false
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export default function EditProductPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProduct(params.id).then((data) => {
            if (data) {
                setProduct(data);
            }
            setLoading(false);
        });
    }, [params.id]);

    if (loading) return (
        <div className="flex items-center justify-center p-12 min-h-screen bg-slate-50/50">
            <Loader2 className="h-8 w-8 animate-spin text-brand-1" />
        </div>
    );

    if (!product) return (
        <div className="p-8 max-w-lg mx-auto mt-12">
            <Alert variant="error" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Producto no encontrado o acceso denegado.</span>
            </Alert>
            <Button asChild className="mt-4 w-full bg-brand-1 hover:bg-brand-2 text-white">
                <Link href="/products">Volver al Catálogo</Link>
            </Button>
        </div>
    );

    return <EditProductForm product={product} />;
}

function EditProductForm({ product }: { product: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [state, formAction] = useActionState(
        async (prevState: any, formData: FormData) => {
            const res = await updateProduct(product.id, prevState, formData);
            return {
                message: res?.message || '',
                errors: (res as any)?.errors || {},
                success: (res as any)?.success || false
            };
        },
        initialState
    );

    // Initial query tab selection
    const initialTab = searchParams.get('tab') || 'general';

    // Controlled state
    const [activeTab, setActiveTab] = useState(initialTab);
    const [codigoInterno, setCodigoInterno] = useState(product.codigoInterno || '');
    const [codigoBarras, setCodigoBarras] = useState(product.codigoBarras || '');
    const [descripcion, setDescripcion] = useState(product.descripcion || '');
    const [descripcionLarga, setDescripcionLarga] = useState(product.descripcionLarga || '');
    const [codigoTasaItbms, setCodigoTasaItbms] = useState(product.codigoTasaItbms || '01');
    const [unidadMedida, setUnidadMedida] = useState(product.unidadMedida || 'UND');
    const [costoUnitario, setCostoUnitario] = useState(product.costoUnitario ? product.costoUnitario.toString() : '0');
    const [precioVenta, setPrecioVenta] = useState(product.precioVenta ? product.precioVenta.toString() : '0');
    const [stockActual, setStockActual] = useState(product.stockActual?.toString() || '0');
    const [stockMinimo, setStockMinimo] = useState(product.stockMinimo?.toString() || '0');
    const [activo, setActivo] = useState(product.activo ? 'true' : 'false');

    // Derived Calculations
    const costNum = parseFloat(costoUnitario) || 0;
    const priceNum = parseFloat(precioVenta) || 0;
    
    const rentabilidad = priceNum > 0 ? (priceNum - costNum).toFixed(2) : '0.00';
    const margin = priceNum > 0 && costNum > 0 ? (((priceNum - costNum) / priceNum) * 100).toFixed(1) : '0.0';

    const itbmsRates: Record<string, number> = { '00': 0, '01': 0.07, '02': 0.10, '03': 0.15 };
    const itbmsRate = itbmsRates[codigoTasaItbms] || 0;
    const itbmsEstimado = (priceNum * itbmsRate).toFixed(2);
    const precioConImpuestos = (priceNum * (1 + itbmsRate)).toFixed(2);

    const stockActualNum = parseInt(stockActual) || 0;
    const stockMinimoNum = parseInt(stockMinimo) || 0;
    
    const stockPercentage = stockMinimoNum > 0 
        ? Math.min((stockActualNum / (stockMinimoNum * 2.5)) * 100, 100) 
        : 0;

    // Toast feedback on action response
    useEffect(() => {
        if (state?.success) {
            toast.success('Producto actualizado correctamente');
            router.push('/products');
        } else if (state?.message) {
            if (state.message.length > 0) toast.error(state.message);
        }
    }, [state, router]);

    return (
        <form action={formAction} className="flex flex-col min-h-screen bg-slate-50/50">
            {/* Header Sticky - Compact */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/products" className="text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100 shrink-0">
                        <ArrowLeft className="h-4.5 w-4.5" />
                    </Link>
                    <div className="truncate">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-sm md:text-base font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">
                                {descripcion || 'Editar Producto'}
                            </h1>
                            <Badge className="bg-brand-1/10 text-brand-1 text-[10px] font-bold border-transparent px-2 py-0.5 rounded">
                                {codigoInterno || 'SIN CÓDIGO'}
                            </Badge>
                            <Badge className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded border-transparent",
                                activo === 'true' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                {activo === 'true' ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.back()} className="h-9 text-xs font-semibold text-slate-600">
                        Cancelar
                    </Button>
                    <SubmitButton />
                </div>
            </div>

            {/* Main Content (2 columns on desktop/laptop, 1 column on tablet/mobile) */}
            <div className="flex-1 w-full px-4 md:px-6 py-5 max-w-7xl mx-auto">
                {state?.message && !state.success && (
                    <Alert variant="error" className="mb-4 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        <span>{state.message}</span>
                    </Alert>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN: Main Form with Tabs (8 cols) */}
                    <div className="xl:col-span-8 space-y-4">
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-visible">
                            <CardContent className="p-4 sm:p-5">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                                    <TabsList className="bg-slate-50 p-1 rounded-lg w-full justify-start h-10 border border-slate-100">
                                        <TabsTrigger value="general" className="text-xs font-bold text-slate-500 rounded-md px-3.5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                            General
                                        </TabsTrigger>
                                        <TabsTrigger value="prices" className="text-xs font-bold text-slate-500 rounded-md px-3.5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                            Precios
                                        </TabsTrigger>
                                        <TabsTrigger value="inventory" className="text-xs font-bold text-slate-500 rounded-md px-3.5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                            Inventario
                                        </TabsTrigger>
                                        <TabsTrigger value="multimedia" className="text-xs font-bold text-slate-500 rounded-md px-3.5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                            Multimedia
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="text-xs font-bold text-slate-500 rounded-md px-3.5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                            Historial
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* TAB 1: INFORMACIÓN GENERAL */}
                                    <TabsContent value="general" className="mt-4 space-y-4 outline-none">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Código Interno */}
                                            <div className="space-y-1">
                                                <Label htmlFor="codigoInterno" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Código Interno</Label>
                                                <Input 
                                                    id="codigoInterno"
                                                    name="codigoInterno" 
                                                    value={codigoInterno} 
                                                    onChange={(e) => setCodigoInterno(e.target.value)}
                                                    required 
                                                    className={cn("h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full", state?.errors?.codigoInterno && "border-red-500")}
                                                />
                                                {state?.errors?.codigoInterno && <p className="text-[10px] text-red-500 font-bold mt-0.5">{state.errors.codigoInterno[0]}</p>}
                                            </div>

                                            {/* Código de Barras / SKU Alterno */}
                                            <div className="space-y-1">
                                                <Label htmlFor="codigoBarras" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Código de Barras / SKU Alterno</Label>
                                                <Input 
                                                    id="codigoBarras"
                                                    name="codigoBarras" 
                                                    value={codigoBarras} 
                                                    onChange={(e) => setCodigoBarras(e.target.value)}
                                                    className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full"
                                                    placeholder="Opcional"
                                                />
                                            </div>

                                            {/* Unidad de Medida */}
                                            <div className="space-y-1">
                                                <Label htmlFor="unidadMedida" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unidad de Medida</Label>
                                                <Select name="unidadMedida" value={unidadMedida} onValueChange={setUnidadMedida}>
                                                    <SelectTrigger id="unidadMedida" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="UND" className="text-xs sm:text-sm cursor-pointer">Unidad (UND)</SelectItem>
                                                        <SelectItem value="HRS" className="text-xs sm:text-sm cursor-pointer">Hora (HRS)</SelectItem>
                                                        <SelectItem value="KG" className="text-xs sm:text-sm cursor-pointer">Kilogramo (KG)</SelectItem>
                                                        <SelectItem value="LT" className="text-xs sm:text-sm cursor-pointer">Litro (LT)</SelectItem>
                                                        <SelectItem value="MT" className="text-xs sm:text-sm cursor-pointer">Metro (MT)</SelectItem>
                                                        <SelectItem value="CJ" className="text-xs sm:text-sm cursor-pointer">Caja (CJ)</SelectItem>
                                                        <SelectItem value="SRV" className="text-xs sm:text-sm cursor-pointer">Servicio (SRV)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Estado (Toggle Activo/Inactivo) */}
                                            <div className="space-y-1">
                                                <Label htmlFor="activo" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estado del Producto</Label>
                                                <Select name="activo" value={activo} onValueChange={setActivo}>
                                                    <SelectTrigger id="activo" className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-lg w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="true" className="text-xs sm:text-sm cursor-pointer text-emerald-600 font-semibold">Activo</SelectItem>
                                                        <SelectItem value="false" className="text-xs sm:text-sm cursor-pointer text-red-600 font-semibold">Inactivo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Descripción Corta */}
                                        <div className="space-y-1">
                                            <Label htmlFor="descripcion" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Descripción Corta</Label>
                                            <Input 
                                                id="descripcion"
                                                name="descripcion" 
                                                value={descripcion} 
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                required 
                                                className={cn("h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full", state?.errors?.descripcion && "border-red-500")}
                                            />
                                            {state?.errors?.descripcion && <p className="text-[10px] text-red-500 font-bold mt-0.5">{state.errors.descripcion[0]}</p>}
                                        </div>

                                        {/* Descripción Detallada */}
                                        <div className="space-y-1">
                                            <Label htmlFor="descripcionLarga" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Descripción Detallada / Observaciones para Facturación</Label>
                                            <Textarea 
                                                id="descripcionLarga"
                                                name="descripcionLarga" 
                                                value={descripcionLarga} 
                                                onChange={(e) => setDescripcionLarga(e.target.value)}
                                                rows={4} 
                                                className="text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full resize-none p-3" 
                                                placeholder="Detalles del producto o servicio que se imprimirán en las facturas..."
                                            />
                                        </div>
                                    </TabsContent>

                                    {/* TAB 2: PRECIOS E IMPUESTOS */}
                                    <TabsContent value="prices" className="mt-4 space-y-4 outline-none">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Costo Unitario */}
                                            <div className="space-y-1">
                                                <Label htmlFor="costoUnitario" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Costo Unitario (Base)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
                                                    <Input
                                                        id="costoUnitario"
                                                        name="costoUnitario"
                                                        type="number"
                                                        step="0.01"
                                                        value={costoUnitario}
                                                        onChange={(e) => setCostoUnitario(e.target.value)}
                                                        className="h-10 text-xs sm:text-sm pl-7 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">USD</span>
                                                </div>
                                            </div>

                                            {/* Precio de Venta */}
                                            <div className="space-y-1">
                                                <Label htmlFor="precioVenta" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Precio de Venta (Neto)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
                                                    <Input
                                                        id="precioVenta"
                                                        name="precioVenta"
                                                        type="number"
                                                        step="0.01"
                                                        value={precioVenta}
                                                        onChange={(e) => setPrecioVenta(e.target.value)}
                                                        required
                                                        className={cn("h-10 text-xs sm:text-sm pl-7 bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full", state?.errors?.precioVenta && "border-red-500")}
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">USD</span>
                                                </div>
                                                {state?.errors?.precioVenta && <p className="text-[10px] text-red-500 font-bold mt-0.5">{state.errors.precioVenta[0]}</p>}
                                            </div>
                                        </div>

                                        {/* Tasa ITBMS */}
                                        <div className="space-y-2 pt-1">
                                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tasa de ITBMS Fiscal</Label>
                                            <input type="hidden" name="codigoTasaItbms" value={codigoTasaItbms} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                {[
                                                    { code: '01', label: '7%', sub: 'Servicios/Bienes' },
                                                    { code: '02', label: '10%', sub: 'Licores' },
                                                    { code: '03', label: '15%', sub: 'Tabaco' },
                                                    { code: '00', label: 'Exento', sub: '0%' }
                                                ].map((rate) => (
                                                    <div
                                                        key={rate.code}
                                                        onClick={() => setCodigoTasaItbms(rate.code)}
                                                        className={cn(
                                                            "cursor-pointer rounded-xl border p-2.5 text-center transition-all select-none",
                                                            codigoTasaItbms === rate.code
                                                                ? "border-brand-1 bg-brand-1/5 ring-1 ring-brand-1 text-brand-1 font-bold"
                                                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className={cn("text-sm font-bold mb-0.5", codigoTasaItbms === rate.code ? "text-brand-1" : "text-slate-700")}>{rate.label}</div>
                                                        <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80">{rate.sub}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* desglose de Impuestos */}
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 mt-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cálculo Fiscal Estimado</span>
                                            <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 text-[10px]">Precio Neto</span>
                                                    <span className="font-mono text-slate-700 mt-0.5">{formatCurrency(priceNum)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 text-[10px]">ITBMS ({codigoTasaItbms === '00' ? '0%' : codigoTasaItbms === '01' ? '7%' : codigoTasaItbms === '02' ? '10%' : '15%'})</span>
                                                    <span className="font-mono text-slate-700 mt-0.5">+{formatCurrency(parseFloat(itbmsEstimado))}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-brand-1 text-[10px]">Precio al Consumidor</span>
                                                    <span className="font-mono text-brand-1 font-bold mt-0.5">{formatCurrency(parseFloat(precioConImpuestos))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* TAB 3: INVENTARIO */}
                                    <TabsContent value="inventory" className="mt-4 space-y-4 outline-none">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Stock Actual */}
                                            <div className="space-y-1">
                                                <Label htmlFor="stockActual" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock Actual (Solo Lectura)</Label>
                                                <Input 
                                                    id="stockActual"
                                                    name="stockActual" 
                                                    value={stockActual} 
                                                    onChange={(e) => setStockActual(e.target.value)}
                                                    type="number"
                                                    className="h-10 text-xs sm:text-sm bg-slate-100 border-slate-200 text-slate-400 font-semibold rounded-lg w-full cursor-not-allowed"
                                                    readOnly
                                                />
                                                <span className="text-[9px] text-slate-400 font-medium block leading-tight">El stock actual se modifica automáticamente mediante transacciones o ajustes del Kardex.</span>
                                            </div>

                                            {/* Stock Mínimo */}
                                            <div className="space-y-1">
                                                <Label htmlFor="stockMinimo" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock Mínimo (Alerta de Reorden)</Label>
                                                <Input 
                                                    id="stockMinimo"
                                                    name="stockMinimo" 
                                                    value={stockMinimo} 
                                                    onChange={(e) => setStockMinimo(e.target.value)}
                                                    type="number"
                                                    required
                                                    className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Sales History (Salidas de Facturación) */}
                                        <div className="space-y-2 pt-3">
                                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historial de Salidas (Facturación Real)</h3>
                                            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableHead className="h-9 text-slate-700 font-bold text-[10px] uppercase">Factura</TableHead>
                                                            <TableHead className="h-9 text-slate-700 font-bold text-[10px] uppercase">Cliente</TableHead>
                                                            <TableHead className="h-9 text-slate-700 font-bold text-[10px] uppercase">Fecha</TableHead>
                                                            <TableHead className="h-9 text-slate-700 font-bold text-[10px] uppercase text-center">Cantidad</TableHead>
                                                            <TableHead className="h-9 text-slate-700 font-bold text-[10px] uppercase text-right">Precio</TableHead>
                                                            <TableHead className="h-9 text-slate-700 font-bold text-[10px] uppercase text-right pr-4">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {product.salesHistory && product.salesHistory.length > 0 ? (
                                                            product.salesHistory.map((sale: any) => (
                                                                <TableRow key={sale.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
                                                                    <TableCell className="py-2 font-semibold text-slate-800 text-[11px] font-mono">{sale.facturaNumero}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] font-medium text-slate-600 max-w-[140px] truncate">{sale.cliente}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-slate-500">{new Date(sale.fecha).toLocaleDateString('es-PA')}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-center font-bold text-slate-700">{sale.cantidad} uds</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-right font-mono font-medium text-slate-600">{formatCurrency(sale.precio)}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-right font-mono font-bold text-slate-800 pr-4">{formatCurrency(sale.total)}</TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="h-28 text-center text-slate-400 text-xs font-semibold">
                                                                    <Warehouse className="h-8 w-8 mx-auto opacity-20 mb-2 text-slate-400" />
                                                                    No hay ventas registradas para este producto.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* TAB 4: MULTIMEDIA */}
                                    <TabsContent value="multimedia" className="mt-4 outline-none">
                                        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/30">
                                            <ImageIcon className="mx-auto h-10 w-10 opacity-30 text-slate-400 mb-3" />
                                            <h4 className="text-sm font-bold text-slate-700">Soporte Multimedia Inactivo</h4>
                                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                                                El esquema de base de datos actual no tiene una columna de imágenes vinculada a los productos. Para habilitarla se requerirá aplicar una migración estructurada.
                                            </p>
                                        </div>
                                    </TabsContent>

                                    {/* TAB 5: HISTORIAL DE CAMBIOS (AUDITORIA REAL) */}
                                    <TabsContent value="history" className="mt-4 outline-none space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                <History className="h-4 w-4 text-slate-500" />
                                                <span>Auditoría de Registro</span>
                                            </div>

                                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                                {product.auditHistory && product.auditHistory.length > 0 ? (
                                                    product.auditHistory.map((log: any, idx: number) => (
                                                        <div key={log.id} className="relative pl-6 pb-4 last:pb-0 border-l border-slate-100 last:border-transparent">
                                                            {/* Point Marker */}
                                                            <div className="absolute left-[-4.5px] top-1 h-2 w-2 rounded-full bg-brand-1 ring-4 ring-brand-1/10" />
                                                            
                                                            <div className="text-xs bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 shadow-sm">
                                                                <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
                                                                    <div className="flex items-center gap-1 font-bold text-slate-700">
                                                                        <User className="h-3 w-3 text-slate-400" />
                                                                        <span>{log.usuarioNombre}</span>
                                                                        <span className="text-slate-300">·</span>
                                                                        <span className="text-slate-400 font-normal font-mono">{log.usuarioEmail}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 font-semibold text-slate-400">
                                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                                        <span>{new Date(log.createdAt).toLocaleString('es-PA')}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold text-slate-800">
                                                                        Acción: {log.accion === 'crear' ? 'Creación de Producto' : log.accion === 'editar' ? 'Edición de Campos' : log.accion}
                                                                    </span>
                                                                    <Badge className={cn(
                                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded border-transparent",
                                                                        log.accion === 'crear' ? "bg-emerald-50 text-emerald-600" : "bg-brand-1/5 text-brand-1"
                                                                    )}>
                                                                        {log.accion.toUpperCase()}
                                                                    </Badge>
                                                                </div>

                                                                {/* Diff list */}
                                                                {log.datosAntes && log.datosDespues && (
                                                                    <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-100 mt-1 space-y-1 leading-normal">
                                                                        {Object.keys(log.datosDespues).map((key) => {
                                                                            const before = log.datosAntes[key];
                                                                            const after = log.datosDespues[key];
                                                                            if (JSON.stringify(before) !== JSON.stringify(after)) {
                                                                                // Ignore metadata
                                                                                if (['updatedAt', 'createdAt'].includes(key)) return null;
                                                                                return (
                                                                                    <div key={key} className="flex flex-wrap gap-1">
                                                                                        <span className="font-bold text-slate-700">{key}:</span>
                                                                                        <span className="text-red-500 line-through">{String(before || '—')}</span>
                                                                                        <span className="text-slate-300">→</span>
                                                                                        <span className="text-emerald-600 font-bold">{String(after || '—')}</span>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                                        <History className="h-8 w-8 mx-auto opacity-20 mb-2" />
                                                        No hay auditorías registradas para este producto.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Sidebar Summary Widget (4 cols) */}
                    <div className="xl:col-span-4 space-y-4">
                        
                        {/* Summary Card */}
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Package className="h-4.5 w-4.5 text-brand-1" />
                                    <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">Resumen de Ficha</CardTitle>
                                </div>
                                <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                    {unidadMedida}
                                </span>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Precio de Lista</span>
                                    <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                                        {formatCurrency(priceNum)}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-100 w-full" />

                                {/* Rentabilidad Widget */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-500">Rentabilidad</span>
                                        <span className="font-bold text-emerald-600">+{formatCurrency(parseFloat(rentabilidad))}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 leading-none">Margen Bruto</span>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-transparent hover:bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded">
                                            {margin}%
                                        </Badge>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 w-full" />

                                {/* Stock Widget */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-500">Estado de Stock</span>
                                        <Badge className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded border-transparent",
                                            stockActualNum <= 0 
                                                ? "bg-red-50 text-red-600 hover:bg-red-50" 
                                                : stockActualNum < stockMinimoNum 
                                                ? "bg-amber-50 text-amber-600 hover:bg-amber-50" 
                                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                                        )}>
                                            {stockActualNum <= 0 ? 'Agotado' : stockActualNum < stockMinimoNum ? 'Bajo Stock' : 'Saludable'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <Progress value={stockPercentage} className="h-2 bg-slate-100 [&>div]:bg-brand-1" />
                                        <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                            <span>Mínimo: {stockMinimoNum}</span>
                                            <span className="text-slate-600 font-bold">{stockActualNum} uds</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata Audit Card */}
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden text-xs text-slate-500">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                        Creado:
                                    </span>
                                    <span className="font-semibold text-slate-700">{new Date(product.createdAt).toLocaleDateString('es-PA')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <History className="h-3.5 w-3.5 text-slate-400" />
                                        Modificado:
                                    </span>
                                    <span className="font-semibold text-slate-700">{new Date(product.updatedAt).toLocaleDateString('es-PA')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs shadow-sm px-4 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all">
            {pending ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando...</span>
                </>
            ) : (
                <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Guardar</span>
                </>
            )}
        </Button>
    );
}
