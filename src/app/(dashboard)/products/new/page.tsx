'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Package, Calculator, Percent, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createProduct } from '@/lib/actions/products';
import { useState, useActionState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    calcularITBMS,
    calcularPrecioConImpuesto,
    calcularMargen,
    formatearMoneda,
    formatearPorcentaje
} from '@/lib/utils/fiscal';

const initialState = {
    message: '',
    errors: {} as Record<string, string[] | undefined>,
};

function formatCurrency(value: number) {
    return formatearMoneda(value);
}

export default function NewProductPage() {
    const router = useRouter();
    const [state, formAction] = useActionState(
        async (prevState: any, formData: FormData) => {
            const res = await createProduct(prevState, formData);
            return {
                message: res?.message || '',
                errors: (res as any)?.errors || {}
            };
        },
        initialState
    );

    // Controlled state for dynamic margin and tax preview
    const [codigoInterno, setCodigoInterno] = useState('');
    const [codigoBarras, setCodigoBarras] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [descripcionLarga, setDescripcionLarga] = useState('');
    const [codigoTasaItbms, setCodigoTasaItbms] = useState('01');
    const [unidadMedida, setUnidadMedida] = useState('UND');
    const [costoUnitario, setCostoUnitario] = useState('0');
    const [precioVenta, setPrecioVenta] = useState('0');
    const [stockActual, setStockActual] = useState('0');
    const [stockMinimo, setStockMinimo] = useState('0');

    // Derived Calculations using centralized fiscal utility
    const costNum = parseFloat(costoUnitario) || 0;
    const priceNum = parseFloat(precioVenta) || 0;

    const { rentabilidad: rentabilidadNum, margenPorcentaje: marginNum } = calcularMargen(priceNum, costNum);
    const rentabilidad = rentabilidadNum.toFixed(2);
    const margin = marginNum.toFixed(1);

    const itbmsEstimado = calcularITBMS(priceNum, codigoTasaItbms).toFixed(2);
    const precioConImpuestos = calcularPrecioConImpuesto(priceNum, codigoTasaItbms).toFixed(2);

    // Toast error messages
    useEffect(() => {
        if (state?.message && state.message.length > 0) {
            toast.error(state.message);
        }
    }, [state]);

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
                            <h1 className="text-sm md:text-base font-bold text-slate-800 truncate">
                                Registrar Nuevo Producto
                            </h1>
                            <Badge className="bg-brand-1/10 text-brand-1 text-[10px] font-bold border-transparent px-2 py-0.5 rounded">
                                NUEVO
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

            {/* Main Content */}
            <div className="flex-1 w-full px-4 md:px-6 py-5 max-w-7xl mx-auto">
                {state?.message && (
                    <Alert variant="error" className="mb-4 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        <span>{state.message}</span>
                    </Alert>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN: General Information (8 cols) */}
                    <div className="xl:col-span-8 space-y-4">
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-visible">
                            <CardHeader className="py-4 px-5 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Información General</CardTitle>
                                <CardDescription className="text-xs text-slate-400">Datos básicos e identificación del producto o servicio en el sistema</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Código Interno */}
                                    <div className="space-y-1">
                                        <Label htmlFor="codigoInterno" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Código Interno (SKU) *</Label>
                                        <Input 
                                            id="codigoInterno"
                                            name="codigoInterno" 
                                            value={codigoInterno} 
                                            onChange={(e) => setCodigoInterno(e.target.value)}
                                            required 
                                            placeholder="PROD-001"
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

                                    {/* Estado predeterminado */}
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estado Inicial</Label>
                                        <Input 
                                            value="Activo (Por Defecto)" 
                                            disabled 
                                            className="h-10 text-xs sm:text-sm bg-slate-100 text-slate-500 font-semibold border-slate-200 rounded-lg w-full cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Descripción Corta */}
                                <div className="space-y-1">
                                    <Label htmlFor="descripcion" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Descripción Corta *</Label>
                                    <Input 
                                        id="descripcion"
                                        name="descripcion" 
                                        value={descripcion} 
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        required 
                                        placeholder="Nombre identificador del producto o servicio"
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
                                        placeholder="Detalles extendidos que aparecerán en la factura fiscal impresa..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Multimedia Support Notice */}
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50">
                                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">Multimedia</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/30">
                                    <h4 className="text-xs font-bold text-slate-700">Soporte Multimedia Inactivo</h4>
                                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                                        El esquema de base de datos actual no tiene una columna de imágenes vinculada a los productos. Para habilitarla se requerirá aplicar una migración estructurada.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Price, Tax and Initial Inventory (4 cols) */}
                    <div className="xl:col-span-4 space-y-4">
                        
                        {/* Price & Margins Card */}
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Calculator className="h-4.5 w-4.5 text-brand-1" />
                                    <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Precios y Márgenes</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
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
                                    <Label htmlFor="precioVenta" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Precio de Venta (Neto) *</Label>
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

                                {/* Margen & Rentabilidad */}
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-500">Rentabilidad</span>
                                        <span className="font-bold text-emerald-600">+{formatCurrency(parseFloat(rentabilidad))}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400">Margen Bruto</span>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-transparent hover:bg-emerald-50 text-[10px] font-bold py-0.5 px-2 rounded-md">
                                            {margin}%
                                        </Badge>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 w-full" />

                                {/* Tasa ITBMS */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tasa de ITBMS Fiscal</Label>
                                    <input type="hidden" name="codigoTasaItbms" value={codigoTasaItbms} />
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { code: '01', label: '7%', sub: 'General' },
                                            { code: '02', label: '10%', sub: 'Licores' },
                                            { code: '03', label: '15%', sub: 'Tabaco' },
                                            { code: '00', label: 'Exento', sub: '0%' }
                                        ].map((rate) => (
                                            <div
                                                key={rate.code}
                                                onClick={() => setCodigoTasaItbms(rate.code)}
                                                className={cn(
                                                    "cursor-pointer rounded-lg border p-2 text-center transition-all select-none",
                                                    codigoTasaItbms === rate.code
                                                        ? "border-brand-1 bg-brand-1/5 ring-1 ring-brand-1 text-brand-1 font-bold"
                                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="text-xs font-bold">{rate.label}</div>
                                                <div className="text-[8px] font-semibold uppercase tracking-wider opacity-85">{rate.sub}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fiscal Estimado box */}
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Breakdown Fiscal Estimado</span>
                                    <div className="flex justify-between text-slate-500 py-0.5">
                                        <span>Precio Neto:</span>
                                        <span className="font-mono text-slate-700">{formatCurrency(priceNum)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 py-0.5">
                                        <span>ITBMS ({codigoTasaItbms === '00' ? '0%' : codigoTasaItbms === '01' ? '7%' : codigoTasaItbms === '02' ? '10%' : '15%'}):</span>
                                        <span className="font-mono text-slate-700">+{formatCurrency(parseFloat(itbmsEstimado))}</span>
                                    </div>
                                    <div className="h-px bg-slate-200 my-1" />
                                    <div className="flex justify-between font-bold text-brand-1 py-0.5">
                                        <span>Total al Consumidor:</span>
                                        <span className="font-mono">{formatCurrency(parseFloat(precioConImpuestos))}</span>
                                    </div>
                                </div>

                                {/* Advertencia de Margen Negativo */}
                                {parseFloat(margin) < 0 && (
                                    <Alert variant="error" className="py-2 px-3 text-xs mt-3">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        <span>Advertencia: Margen negativo. El precio de venta es menor que el costo unitario.</span>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Inventory Card */}
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Package className="h-4.5 w-4.5 text-brand-1" />
                                    <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inventario Inicial</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="stockActual" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock Inicial (Solo Lectura)</Label>
                                        <Input
                                            id="stockActual"
                                            name="stockActual"
                                            type="number"
                                            value="0"
                                            className="h-10 text-xs sm:text-sm bg-slate-100 text-slate-400 font-semibold border-slate-200 rounded-lg w-full cursor-not-allowed"
                                            readOnly
                                        />
                                        <span className="text-[9px] text-slate-400 font-medium block leading-tight">El stock actual se modifica automáticamente mediante transacciones o ajustes del Kardex.</span>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="stockMinimo" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock Mínimo</Label>
                                        <Input
                                            id="stockMinimo"
                                            name="stockMinimo"
                                            type="number"
                                            value={stockMinimo}
                                            onChange={(e) => setStockMinimo(e.target.value)}
                                            className="h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-brand-1 rounded-lg w-full"
                                            placeholder="0"
                                        />
                                    </div>
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
