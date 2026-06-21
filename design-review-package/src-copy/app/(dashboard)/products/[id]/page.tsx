'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
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
    Percent
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
import { updateProduct, getProduct } from '@/lib/actions/products';
import { useState, useEffect, use, useActionState } from 'react';
import { cn } from '@/lib/utils';

const initialState = {
    message: '',
    errors: {},
};

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
        <div className="flex items-center justify-center p-8 min-h-screen bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );

    if (!product) return (
        <div className="p-8">
            <Alert variant="error">Producto no encontrado</Alert>
            <Button asChild className="mt-4"><Link href="/products">Volver</Link></Button>
        </div>
    );

    return <EditProductForm product={product} />;
}

function EditProductForm({ product }: { product: any }) {
    const router = useRouter();
    const updateProductWithId = updateProduct.bind(null, product.id);
    const [state, formAction] = useActionState(updateProductWithId, initialState);

    // Controlled state
    const [activeTab, setActiveTab] = useState('general'); // Default to General
    const [codigoTasaItbms, setCodigoTasaItbms] = useState(product.codigoTasaItbms || '01');
    const [unidadMedida, setUnidadMedida] = useState(product.unidadMedida || 'UND');
    const [costoUnitario, setCostoUnitario] = useState(product.costoUnitario ? product.costoUnitario.toString() : '');
    const [precioVenta, setPrecioVenta] = useState(product.precioVenta ? product.precioVenta.toString() : '');
    const [stockActual, setStockActual] = useState(product.stockActual?.toString() || '0');
    const [stockMinimo, setStockMinimo] = useState(product.stockMinimo?.toString() || '0');

    // Derived Calculations
    const rentabilidad = precioVenta && parseFloat(precioVenta) > 0 && costoUnitario
        ? (parseFloat(precioVenta) - parseFloat(costoUnitario)).toFixed(2)
        : '0.00';

    // Derived Margin
    let margin = '0.0';
    if (precioVenta && costoUnitario && parseFloat(precioVenta) > 0 && parseFloat(costoUnitario) > 0) {
        margin = ((1 - (parseFloat(costoUnitario) / parseFloat(precioVenta))) * 100).toFixed(1);
    }

    const stockPercentage = stockActual && stockMinimo && parseFloat(stockMinimo) > 0
        ? Math.min((parseFloat(stockActual) / (parseFloat(stockMinimo) * 3)) * 100, 100)
        : 0;

    // Toast on success
    useEffect(() => {
        if (state?.success) {
            toast.success('Producto actualizado correctamente');
        } else if (state?.message) {
            if (state.message.length > 0) toast.error(state.message);
        }
    }, [state]);

    return (
        <form action={formAction} className="flex flex-col min-h-screen bg-gray-50/50">
            {/* Header Sticky - Compact */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight text-foreground truncate max-w-md">
                                {product.descripcion || 'Producto Sin Nombre'}
                            </h1>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold tracking-wide">
                                {product.codigoInterno}
                            </span>
                            <span className="text-xs text-muted-foreground border-l pl-3 ml-1 hidden sm:block">
                                Unidad: {unidadMedida}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button type="button" variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                        Cancelar
                    </Button>
                    <SubmitButton />
                </div>
            </div>

            {/* Main Content - Full Width & Dense */}
            <div className="flex-1 w-full px-4 md:px-8 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                    <TabsList className="bg-transparent p-0 border-b border-border w-full justify-start rounded-none h-auto mb-6">
                        {['general', 'prices', 'inventory', 'multimedia', 'history'].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="rounded-none border-b-2 border-transparent px-6 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent"
                            >
                                {tab === 'general' && 'Información General'}
                                {tab === 'prices' && 'Precios e Impuestos'}
                                {tab === 'inventory' && 'Inventario'}
                                {tab === 'multimedia' && 'Multimedia'}
                                {tab === 'history' && 'Historial'}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* GENERAL TAB - FIRST */}
                    <TabsContent value="general" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                            <div className="xl:col-span-8">
                                <Card className="border-none shadow-sm ring-1 ring-black/5">
                                    <CardHeader className="py-4 px-6 border-b border-border">
                                        <CardTitle className="text-base">Información Detallada</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-5">
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1.5">Código Interno</label>
                                                <Input name="codigoInterno" defaultValue={product.codigoInterno} required className="bg-muted/30" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1.5">Unidad de Medida</label>
                                                <Select name="unidadMedida" value={unidadMedida} onValueChange={setUnidadMedida}>
                                                    <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="UND">Unidad (UND)</SelectItem>
                                                        <SelectItem value="HRS">Hora (HRS)</SelectItem>
                                                        <SelectItem value="KG">Kilogramo (KG)</SelectItem>
                                                        <SelectItem value="LT">Litro (LT)</SelectItem>
                                                        <SelectItem value="MT">Metro (MT)</SelectItem>
                                                        <SelectItem value="CJ">Caja (CJ)</SelectItem>
                                                        <SelectItem value="SRV">Servicio (SRV)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">Descripción Corta</label>
                                            <Input name="descripcion" defaultValue={product.descripcion} required className="bg-muted/30" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">Descripción Detallada</label>
                                            <Textarea name="descripcionLarga" defaultValue={product.descripcionLarga || ''} rows={6} className="bg-muted/30 resize-none" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PRECIOS TAB - 2 Column Layout (Dense) */}
                    <TabsContent value="prices" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                            {/* Left Column: Prices (Main Focus) - 7 Cols */}
                            <div className="xl:col-span-7 space-y-6">
                                <Card className="border-none shadow-sm overflow-hidden ring-1 ring-black/5">
                                    <CardHeader className="bg-secondary/30 border-b border-border py-4 px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">$</span>
                                                <CardTitle className="text-base font-semibold">Configuración de Precios</CardTitle>
                                            </div>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Moneda: USD</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-8">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-foreground">Costo Unitario</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                                    <Input
                                                        name="costoUnitario"
                                                        type="number"
                                                        step="0.01"
                                                        value={costoUnitario}
                                                        onChange={(e) => setCostoUnitario(e.target.value)}
                                                        className="pl-7 text-xl font-medium h-12 w-full"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-3.5 text-xs font-semibold text-muted-foreground">USD</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-foreground">Precio de Venta</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                                    <Input
                                                        name="precioVenta"
                                                        type="number"
                                                        step="0.01"
                                                        value={precioVenta}
                                                        onChange={(e) => setPrecioVenta(e.target.value)}
                                                        className="pl-7 text-xl font-medium h-12 w-full text-primary"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-3.5 text-xs font-semibold text-muted-foreground">USD</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Margin Analysis */}
                                        <div className="bg-secondary/20 rounded-xl p-5 border border-border mt-4">
                                            <div className="flex items-end justify-between mb-3">
                                                <div>
                                                    <span className="text-sm font-medium text-foreground">Margen de Ganancia</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={cn("text-3xl font-bold block leading-none tracking-tight", parseFloat(margin) > 20 ? 'text-primary' : 'text-amber-500')}>
                                                        {margin}%
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Custom Progress Bar */}
                                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex mb-3">
                                                <div
                                                    className="h-full bg-muted-foreground/20 transition-all duration-500 border-r border-white/50"
                                                    style={{ width: `${Math.max(0, 100 - parseFloat(margin || '0'))}%` }}
                                                />
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${Math.min(100, parseFloat(margin || '0'))}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs font-medium text-muted-foreground pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                                                    Costo Base: ${costoUnitario || '0.00'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-primary">
                                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                    Ganancia Neta: ${rentabilidad}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: ITBMS & Info - 5 Cols */}
                            <div className="xl:col-span-5 space-y-6">

                                {/* Impuestos ITBMS - Now on Sidebar for balance */}
                                <Card className="border-none shadow-sm ring-1 ring-black/5">
                                    <CardHeader className="bg-secondary/30 border-b border-border py-4 px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Percent className="h-4 w-4 text-muted-foreground" />
                                                <CardTitle className="text-base font-semibold">Impuestos (ITBMS)</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            {[
                                                { code: '01', label: '7%', sub: 'Estándar' },
                                                { code: '02', label: '10%', sub: 'Licores' },
                                                { code: '03', label: '15%', sub: 'Tabaco' },
                                                { code: '00', label: 'Exento', sub: '0%' }
                                            ].map((rate) => (
                                                <div
                                                    key={rate.code}
                                                    onClick={() => setCodigoTasaItbms(rate.code)}
                                                    className={cn(
                                                        "cursor-pointer rounded-lg border px-3 py-3 text-center transition-all hover:bg-secondary",
                                                        codigoTasaItbms === rate.code
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                                                            : "border-border bg-card text-muted-foreground"
                                                    )}
                                                >
                                                    <div className={cn("text-lg font-bold leading-none mb-1", codigoTasaItbms === rate.code ? "text-primary" : "text-foreground")}>{rate.label}</div>
                                                    <div className="text-[10px] uppercase tracking-wider opacity-70">{rate.sub}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pt-2">
                                            <span className="text-xs font-medium text-muted-foreground">Código Personalizado</span>
                                            <div className="relative w-24">
                                                <Input
                                                    name="codigoTasaItbms"
                                                    value={codigoTasaItbms}
                                                    onChange={(e) => setCodigoTasaItbms(e.target.value)}
                                                    className="pr-6 text-right font-medium h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Estado de Inventario - WHITE BACKGROUND */}
                                    <Card className="border shadow-sm bg-white col-span-2 sm:col-span-1">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Inventario</span>
                                                <Warehouse className="h-4 w-4 text-primary/50" />
                                            </div>
                                            <div>
                                                <span className="text-2xl font-bold text-primary">{stockActual}</span>
                                                <span className="text-xs text-muted-foreground ml-2">unidades</span>
                                                <input type="hidden" name="stockActual" value={stockActual} />
                                            </div>
                                            <Progress value={stockPercentage} className="h-1.5 bg-muted [&>div]:bg-primary" />
                                            <div className="flex justify-between text-xs pt-1">
                                                <span className="text-muted-foreground">Mín: {stockMinimo}</span>
                                                <Link href="#" className="font-semibold text-primary hover:underline">Ajustar</Link>
                                                <input type="hidden" name="stockMinimo" value={stockMinimo} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Acciones Rápidas - Compact Links */}
                                    <Card className="border-none shadow-sm col-span-2 sm:col-span-1">
                                        <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
                                            <Button variant="ghost" size="sm" className="justify-start px-2 h-8 text-muted-foreground hover:text-primary" asChild>
                                                <Link href="#">
                                                    <History className="h-3.5 w-3.5 mr-2" />
                                                    Historial
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="justify-start px-2 h-8 text-muted-foreground hover:text-primary" type="button">
                                                <Calculator className="h-3.5 w-3.5 mr-2" />
                                                Simular
                                            </Button>
                                            <Button variant="ghost" size="sm" className="justify-start px-2 h-8 text-muted-foreground hover:text-primary" type="button">
                                                <Copy className="h-3.5 w-3.5 mr-2" />
                                                Duplicar
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                            </div>
                        </div>
                    </TabsContent>

                    {/* Placeholder tabs */}
                    <TabsContent value="inventory" className="p-12 text-center text-muted-foreground border-2 border-dashed border-gray-200 rounded-xl">
                        <Warehouse className="mx-auto h-12 w-12 opacity-20 mb-3" />
                        <h3 className="text-lg font-medium">Gestión Avanzada de Inventario</h3>
                        <p className="text-sm">Próximamente: Kardex, Movimientos y Ajustes Manuales.</p>
                        {/* Hidden inputs to preserve state if stuck on this tab */}
                        <input type="hidden" name="stockActual" value={stockActual} />
                        <input type="hidden" name="stockMinimo" value={stockMinimo} />
                    </TabsContent>

                    <TabsContent value="multimedia" className="p-12 text-center text-muted-foreground border-2 border-dashed border-gray-200 rounded-xl">
                        <ImageIcon className="mx-auto h-12 w-12 opacity-20 mb-3" />
                        <h3 className="text-lg font-medium">Multimedia</h3>
                        <p className="text-sm">Gestión de imágenes y documentos del producto.</p>
                    </TabsContent>

                    <TabsContent value="history" className="p-12 text-center text-muted-foreground border-2 border-dashed border-gray-200 rounded-xl">
                        <History className="mx-auto h-12 w-12 opacity-20 mb-3" />
                        <h3 className="text-lg font-medium">Historial de Cambios</h3>
                    </TabsContent>

                </Tabs>
            </div>
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                </>
            ) : (
                <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                </>
            )}
        </Button>
    );
}
