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
    Warehouse,
    ImageIcon,
    AlertCircle,
    User,
    Calendar,
    CalendarDays,
    Search,
    Plus,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    updateProduct,
    getProduct,
    uploadProductImage,
    deleteProductImage,
    setProductImagePrimary,
    updateProductImageOrder
} from '@/lib/actions/products';
import {
    getKitDeProducto,
    getProductosParaKit,
    crearOActualizarKit,
    desactivarKit
} from '@/lib/actions/product-kits';
import { useState, useEffect, use, useActionState } from 'react';
import { cn } from '@/lib/utils';
import {
    calcularITBMS,
    calcularPrecioConImpuesto,
    calcularMargen,
    formatearMoneda,
    formatearPorcentaje
} from '@/lib/utils/fiscal';
import { RecetaTab } from '@/components/products/RecetaTab';
import { PresentacionesInsumo } from '@/components/suministros/PresentacionesInsumo';

const initialState = {
    message: '',
    errors: {} as Record<string, string[] | undefined>,
    success: false
};

function formatCurrency(value: number) {
    return formatearMoneda(value);
}

export default function EditProductPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [product, setProduct] = useState<Awaited<ReturnType<typeof getProduct>>>(null);
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
        <div className="flex items-center justify-center p-12 min-h-screen bg-secondary/50">
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

function EditProductForm({ product }: { product: NonNullable<Awaited<ReturnType<typeof getProduct>>> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [state, formAction] = useActionState(
        async (prevState: typeof initialState, formData: FormData) => {
            const res = await updateProduct(product.id, prevState, formData);
            return {
                message: res?.message || '',
                errors: (res as { errors?: Record<string, string[] | undefined> })?.errors || {},
                success: (res as { success?: boolean })?.success || false
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
    const [controlaLotes, setControlaLotes] = useState(product.controlaLotes ? 'true' : 'false');
    const [imagenUrl, setImagenUrl] = useState(product.imagenUrl || '');
    const [images, setImages] = useState(product.productImages || []);
    const [activePreviewUrl, setActivePreviewUrl] = useState(product.imagenUrl || '');
    const [categoriaId, setCategoriaId] = useState(product.categoriaId || 'none');
    const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(product.descuentoPorcentaje?.toString() || '0');
    const [categorias, setCategorias] = useState<{ id: string; nombre: string; descuentoPorcentaje: number }[]>([]);

    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.ok ? res.json() : { items: [] })
            .then(data => setCategorias(data.items || []))
            .catch(() => setCategorias([]));
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        toast.info(`Iniciando subida de ${files.length} archivo(s)...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await uploadProductImage(product.id, formData);
                if (res.success && res.image) {
                    setImages(prev => {
                        if (prev.some(img => img.id === res.image?.id)) return prev;
                        const next = [...prev, res.image as unknown as typeof prev[0]];
                        return next.sort((a, b) => a.sortOrder - b.sortOrder);
                    });
                    if (res.image.isPrimary) {
                        setImagenUrl(res.image.imageUrl);
                        setActivePreviewUrl(res.image.imageUrl);
                    }
                } else {
                    toast.error(`Error al subir ${file.name}: ${res.message}`);
                }
            } catch {
                toast.error(`Error de red al subir ${file.name}`);
            }
        }
        toast.success('Proceso de carga de imágenes finalizado.');
    };

    const handleDelete = async (imageId: string) => {
        const img = images.find(i => i.id === imageId);
        if (!img) return;

        toast.promise(
            deleteProductImage(imageId).then((res) => {
                if (res.success) {
                    setImages(prev => {
                        const next = prev.filter(i => i.id !== imageId);
                        if (img.isPrimary && next.length > 0) {
                            next[0].isPrimary = true;
                            setImagenUrl(next[0].imageUrl);
                            setActivePreviewUrl(next[0].imageUrl);
                        } else if (next.length === 0) {
                            setImagenUrl('');
                            setActivePreviewUrl('');
                        }
                        return next;
                    });
                    return 'Imagen eliminada.';
                } else {
                    throw new Error(res.message || 'Error al eliminar la imagen.');
                }
            }),
            {
                loading: 'Eliminando imagen...',
                success: (msg) => msg,
                error: (err) => err.message
            }
        );
    };

    const handleSetPrimary = async (imageId: string) => {
        toast.promise(
            setProductImagePrimary(imageId).then((res) => {
                if (res.success) {
                    setImages(prev => prev.map(img => ({
                        ...img,
                        isPrimary: img.id === imageId
                    })));
                    const img = images.find(i => i.id === imageId);
                    if (img) {
                        setImagenUrl(img.imageUrl);
                        setActivePreviewUrl(img.imageUrl);
                    }
                    return 'Imagen principal actualizada.';
                } else {
                    throw new Error(res.message || 'Error al actualizar imagen principal.');
                }
            }),
            {
                loading: 'Estableciendo imagen principal...',
                success: (msg) => msg,
                error: (err) => err.message
            }
        );
    };

    const handleMove = async (index: number, direction: 'left' | 'right') => {
        const newImages = [...images];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newImages.length) return;

        // Swap
        const temp = newImages[index];
        newImages[index] = newImages[targetIndex];
        newImages[targetIndex] = temp;

        // Update sortOrder values
        const updatedImages = newImages.map((img, i) => ({
            ...img,
            sortOrder: i
        }));
        setImages(updatedImages);

        const orderPayload = updatedImages.map((img, i) => ({
            id: img.id,
            sortOrder: i
        }));

        const res = await updateProductImageOrder(orderPayload);
        if (!res.success) {
            toast.error(res.message);
        } else {
            toast.success('Orden de galería actualizado.');
        }
    };

    // Derived Calculations using centralized fiscal utility
    const costNum = parseFloat(costoUnitario) || 0;
    const priceNum = parseFloat(precioVenta) || 0;
    
    const { rentabilidad: rentabilidadNum, margenPorcentaje: marginNum } = calcularMargen(priceNum, costNum);
    const rentabilidad = rentabilidadNum.toFixed(2);
    const margin = marginNum.toFixed(1);

    const itbmsEstimado = calcularITBMS(priceNum, codigoTasaItbms).toFixed(2);
    const precioConImpuestos = calcularPrecioConImpuesto(priceNum, codigoTasaItbms).toFixed(2);

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
        <form action={formAction} className="flex flex-col min-h-screen bg-secondary/50">
            {/* Header Sticky - Compact */}
            <div className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-accent shrink-0">
                        <ArrowLeft className="h-4.5 w-4.5" />
                    </Link>
                    <div className="truncate">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-sm md:text-base font-bold text-foreground truncate max-w-[200px] md:max-w-md">
                                {descripcion || 'Editar Producto'}
                            </h1>
                            <Badge className="bg-brand-1/10 text-brand-1 text-[10px] font-bold border-transparent px-2 py-0.5 rounded">
                                {codigoInterno || 'SIN CÓDIGO'}
                            </Badge>
                            <Badge className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded border-transparent",
                                activo === 'true' ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                            )}>
                                {activo === 'true' ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.back()} className="h-9 text-xs font-semibold text-muted-foreground">
                        Cancelar
                    </Button>
                    <SubmitButton />
                </div>
            </div>

            {/* Main Content (2 columns on desktop/laptop, 1 column on tablet/mobile) */}
            <div className="flex-1 w-full px-4 md:px-6 py-4 max-w-none mx-auto">
                {state?.message && !state.success && (
                    <Alert variant="error" className="mb-4 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        <span>{state.message}</span>
                    </Alert>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN: Main Form with Tabs (8 cols) */}
                    <div className="xl:col-span-8 space-y-4">
                        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-visible">
                            <CardContent className="p-4 sm:p-5">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                                    {/* En mobile las 6 pestañas no caben en una fila sin desbordarse — se
                                        envuelven en un contenedor con scroll horizontal en vez de apretarlas
                                        o cortarlas. shrink-0 evita que cada trigger se comprima. */}
                                    <div className="-mx-1 px-1 overflow-x-auto">
                                        <TabsList className="bg-muted p-1 rounded-lg w-full sm:w-full justify-start h-10 border border-border inline-flex sm:flex min-w-max sm:min-w-0">
                                            <TabsTrigger value="general" className="text-xs font-bold text-muted-foreground rounded-md px-3.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                                General
                                            </TabsTrigger>
                                            <TabsTrigger value="prices" className="text-xs font-bold text-muted-foreground rounded-md px-3.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                                Precios
                                            </TabsTrigger>
                                            <TabsTrigger value="inventory" className="text-xs font-bold text-muted-foreground rounded-md px-3.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                                Inventario
                                            </TabsTrigger>
                                            <TabsTrigger value="kit" className="text-xs font-bold text-muted-foreground rounded-md px-3.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                                Kit
                                            </TabsTrigger>
                                            <TabsTrigger value="receta" className="text-xs font-bold text-muted-foreground rounded-md px-3.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                                Receta e Insumos
                                            </TabsTrigger>
                                            <TabsTrigger value="multimedia" className="text-xs font-bold text-muted-foreground rounded-md px-3.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                                Multimedia
                                            </TabsTrigger>
                                            <TabsTrigger value="history" className="text-xs font-bold text-muted-foreground rounded-md px-3.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-brand-1 data-[state=active]:shadow-sm">
                                                Historial
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    {/* TAB 1: INFORMACIÓN GENERAL */}
                                    {/* forceMount: el <form> envuelve TODAS las pestañas, y por defecto Radix
                                        desmonta del DOM las pestañas inactivas — eso hacía desaparecer del
                                        FormData los campos de las otras pestañas (precio, stock, imagen) al
                                        guardar, disparando "Error de validación" aunque estuvieran bien llenos. */}
                                    <TabsContent value="general" forceMount className="mt-4 space-y-4 outline-none data-[state=inactive]:hidden">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Código Interno */}
                                            <div className="space-y-1">
                                                <Label htmlFor="codigoInterno" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Código Interno</Label>
                                                <Input 
                                                    id="codigoInterno"
                                                    name="codigoInterno" 
                                                    value={codigoInterno} 
                                                    onChange={(e) => setCodigoInterno(e.target.value)}
                                                    required 
                                                    className={cn("h-10 text-xs sm:text-sm bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full", state?.errors?.codigoInterno && "border-danger")}
                                                />
                                                {state?.errors?.codigoInterno && <p className="text-[10px] text-danger font-bold mt-0.5">{state.errors.codigoInterno[0]}</p>}
                                            </div>

                                            {/* Código de Barras / SKU Alterno */}
                                            <div className="space-y-1">
                                                <Label htmlFor="codigoBarras" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Código de Barras / SKU Alterno</Label>
                                                <Input 
                                                    id="codigoBarras"
                                                    name="codigoBarras" 
                                                    value={codigoBarras} 
                                                    onChange={(e) => setCodigoBarras(e.target.value)}
                                                    className="h-10 text-xs sm:text-sm bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full"
                                                    placeholder="Opcional"
                                                />
                                            </div>

                                            {/* Unidad de Medida */}
                                            <div className="space-y-1">
                                                <Label htmlFor="unidadMedida" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Unidad de Medida</Label>
                                                <Select name="unidadMedida" value={unidadMedida} onValueChange={setUnidadMedida}>
                                                    <SelectTrigger id="unidadMedida" className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full">
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
                                                <Label htmlFor="activo" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Estado del Producto</Label>
                                                <Select name="activo" value={activo} onValueChange={setActivo}>
                                                    <SelectTrigger id="activo" className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="true" className="text-xs sm:text-sm cursor-pointer text-success font-semibold">Activo</SelectItem>
                                                        <SelectItem value="false" className="text-xs sm:text-sm cursor-pointer text-danger font-semibold">Inactivo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Descripción Corta */}
                                        <div className="space-y-1">
                                            <Label htmlFor="descripcion" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Descripción Corta</Label>
                                            <Input 
                                                id="descripcion"
                                                name="descripcion" 
                                                value={descripcion} 
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                required 
                                                className={cn("h-10 text-xs sm:text-sm bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full", state?.errors?.descripcion && "border-danger")}
                                            />
                                            {state?.errors?.descripcion && <p className="text-[10px] text-danger font-bold mt-0.5">{state.errors.descripcion[0]}</p>}
                                        </div>

                                        {/* Descripción Detallada */}
                                        <div className="space-y-1">
                                            <Label htmlFor="descripcionLarga" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Descripción Detallada / Observaciones para Facturación</Label>
                                            <Textarea 
                                                id="descripcionLarga"
                                                name="descripcionLarga" 
                                                value={descripcionLarga} 
                                                onChange={(e) => setDescripcionLarga(e.target.value)}
                                                rows={4} 
                                                className="text-xs sm:text-sm bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full resize-none p-3" 
                                                placeholder="Detalles del producto o servicio que se imprimirán en las facturas..."
                                            />
                                        </div>
                                    </TabsContent>

                                    {/* TAB 2: PRECIOS E IMPUESTOS */}
                                    <TabsContent value="prices" forceMount className="mt-2 space-y-3 outline-none data-[state=inactive]:hidden">
                                        {/* Fila 1: Costo unitario base & Precio de venta neto */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Costo Unitario */}
                                            <div className="space-y-1">
                                                <Label htmlFor="costoUnitario" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Costo Unitario Base</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">$</span>
                                                    <Input
                                                        id="costoUnitario"
                                                        name="costoUnitario"
                                                        type="number"
                                                        step="0.01"
                                                        value={costoUnitario}
                                                        onChange={(e) => setCostoUnitario(e.target.value)}
                                                        className="h-10 text-xs sm:text-sm pl-7 pr-12 bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USD</span>
                                                </div>
                                            </div>

                                            {/* Precio de Venta */}
                                            <div className="space-y-1">
                                                <Label htmlFor="precioVenta" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Precio de Venta Neto</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">$</span>
                                                    <Input
                                                        id="precioVenta"
                                                        name="precioVenta"
                                                        type="number"
                                                        step="0.01"
                                                        value={precioVenta}
                                                        onChange={(e) => setPrecioVenta(e.target.value)}
                                                        required
                                                        className={cn("h-10 text-xs sm:text-sm pl-7 pr-12 bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full", state?.errors?.precioVenta && "border-danger")}
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USD</span>
                                                </div>
                                                {state?.errors?.precioVenta && <p className="text-[10px] text-danger font-bold mt-0.5">{state.errors.precioVenta[0]}</p>}
                                            </div>
                                        </div>

                                        {/* Fila 2: Selector de ITBMS fiscal, Precio con impuesto, Margen bruto */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                            {/* Selector de ITBMS fiscal */}
                                            <div className="space-y-1 sm:col-span-1">
                                                <Label htmlFor="codigoTasaItbms" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Tasa ITBMS Fiscal</Label>
                                                <Select name="codigoTasaItbms" value={codigoTasaItbms} onValueChange={setCodigoTasaItbms}>
                                                    <SelectTrigger id="codigoTasaItbms" className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="00" className="text-xs sm:text-sm cursor-pointer">Exento (0%)</SelectItem>
                                                        <SelectItem value="01" className="text-xs sm:text-sm cursor-pointer">7% - Servicios/Bienes</SelectItem>
                                                        <SelectItem value="02" className="text-xs sm:text-sm cursor-pointer">10% - Licores</SelectItem>
                                                        <SelectItem value="03" className="text-xs sm:text-sm cursor-pointer">15% - Tabaco</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Precio con Impuesto */}
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Precio con Impuesto</Label>
                                                <Input 
                                                    value={formatearMoneda(parseFloat(precioConImpuestos))}
                                                    disabled
                                                    className="h-10 text-xs sm:text-sm bg-muted text-muted-foreground font-bold border-border rounded-lg w-full cursor-not-allowed font-mono"
                                                />
                                            </div>

                                            {/* Margen Bruto */}
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Margen Bruto</Label>
                                                <div className={cn(
                                                    "h-10 flex items-center justify-between px-3 rounded-lg border text-xs font-bold font-mono",
                                                    parseFloat(margin) <= 0 
                                                        ? "bg-danger-bg border-danger/20 text-danger"
                                                        : parseFloat(margin) < 15
                                                        ? "bg-warning-bg border-warning/20 text-warning"
                                                        : "bg-success-bg border-success/20 text-success"
                                                )}>
                                                    <span>Rent: +{formatearMoneda(parseFloat(rentabilidad))}</span>
                                                    <span>{formatearPorcentaje(parseFloat(margin))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fila 3: Cálculo fiscal estimado compacto */}
                                        <div className="bg-muted rounded-xl p-3 border border-border space-y-1 text-xs">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cálculo Fiscal Estimado Detallado</span>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-muted-foreground">
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-[10px]">Neto Gravable</span>
                                                    <span className="font-mono text-foreground mt-0.5">{formatearMoneda(priceNum)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-[10px]">ITBMS ({codigoTasaItbms === '00' ? '0%' : codigoTasaItbms === '01' ? '7%' : codigoTasaItbms === '02' ? '10%' : '15%'})</span>
                                                    <span className="font-mono text-foreground mt-0.5">+{formatearMoneda(parseFloat(itbmsEstimado))}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-brand-1 text-[10px] font-bold">Consumidor Final</span>
                                                    <span className="font-mono text-brand-1 font-bold mt-0.5">{formatearMoneda(parseFloat(precioConImpuestos))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Advertencia de Margen Negativo */}
                                        {parseFloat(margin) < 0 && (
                                            <Alert variant="error" className="py-2 px-3 text-xs">
                                                <AlertCircle className="h-4 w-4 mr-2" />
                                                <span>Advertencia: El precio de venta es menor que el costo unitario (margen negativo).</span>
                                            </Alert>
                                        )}

                                        {/* Categoría y Descuento */}
                                        <div className="h-px bg-muted w-full my-1" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Categoría</Label>
                                                <Select name="categoriaId" value={categoriaId} onValueChange={setCategoriaId}>
                                                    <SelectTrigger className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full">
                                                        <SelectValue placeholder="Sin categoría" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="none" className="text-xs sm:text-sm cursor-pointer">Sin categoría</SelectItem>
                                                        {categorias.map((c) => (
                                                            <SelectItem key={c.id} value={c.id} className="text-xs sm:text-sm cursor-pointer">
                                                                {c.nombre} {c.descuentoPorcentaje > 0 ? `(desc. ${c.descuentoPorcentaje}%)` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="descuentoPorcentaje" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Descuento Individual (%)</Label>
                                                <Input
                                                    id="descuentoPorcentaje"
                                                    name="descuentoPorcentaje"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={descuentoPorcentaje}
                                                    onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                                                    className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Este descuento se sugiere automáticamente en POS/Facturación. El descuento individual del producto manda sobre el de su categoría.</p>
                                    </TabsContent>

                                    {/* TAB 3: INVENTARIO */}
                                    <TabsContent value="inventory" forceMount className="mt-4 space-y-4 outline-none data-[state=inactive]:hidden">
                                        {unidadMedida === 'SRV' ? (
                                            <>
                                                <Alert className="py-2.5 px-3 text-xs bg-info-bg border-info/20 text-info">
                                                    <AlertCircle className="h-4 w-4 mr-2" />
                                                    <span>Este producto está marcado como <strong>Servicio</strong> (unidad SRV) — no lleva control de inventario. Se puede vender sin límite de stock.</span>
                                                </Alert>
                                                <input type="hidden" name="stockActual" value="0" />
                                                <input type="hidden" name="stockMinimo" value="0" />
                                                <input type="hidden" name="controlaLotes" value="false" />
                                            </>
                                        ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Stock Actual */}
                                            <div className="space-y-1">
                                                <Label htmlFor="stockActual" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Stock Actual</Label>
                                                <Input
                                                    id="stockActual"
                                                    name="stockActual"
                                                    value={stockActual}
                                                    onChange={(e) => setStockActual(e.target.value)}
                                                    type="number"
                                                    className="h-10 text-xs sm:text-sm bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full"
                                                />
                                            </div>

                                            {/* Stock Mínimo */}
                                            <div className="space-y-1">
                                                <Label htmlFor="stockMinimo" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Stock Mínimo (Alerta de Reorden)</Label>
                                                <Input
                                                    id="stockMinimo"
                                                    name="stockMinimo"
                                                    value={stockMinimo}
                                                    onChange={(e) => setStockMinimo(e.target.value)}
                                                    type="number"
                                                    required
                                                    className="h-10 text-xs sm:text-sm bg-muted/50 border-border focus-visible:ring-brand-1 rounded-lg w-full"
                                                />
                                            </div>

                                            <div className="space-y-1 sm:col-span-2">
                                                <Label htmlFor="controlaLotes" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Control de Lotes y Vencimientos</Label>
                                                <Select name="controlaLotes" value={controlaLotes} onValueChange={setControlaLotes}>
                                                    <SelectTrigger id="controlaLotes" className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full sm:w-1/2">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg">
                                                        <SelectItem value="false" className="text-xs sm:text-sm cursor-pointer">No controla lotes</SelectItem>
                                                        <SelectItem value="true" className="text-xs sm:text-sm cursor-pointer">Este producto controla lotes y vencimientos</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        )}

                                        {/* Sales History (Salidas de Facturación) */}
                                        <div className="space-y-2 pt-3">
                                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Historial de Salidas (Facturación Real)</h3>
                                            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                                                <Table>
                                                    <TableHeader className="bg-muted">
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase">Factura</TableHead>
                                                            <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase">Cliente</TableHead>
                                                            <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase">Fecha</TableHead>
                                                            <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-center">Cantidad</TableHead>
                                                            <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-right">Precio</TableHead>
                                                            <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-right pr-4">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {product.salesHistory && product.salesHistory.length > 0 ? (
                                                            product.salesHistory.map((sale) => (
                                                                <TableRow 
                                                                    key={sale.id} 
                                                                    className="hover:bg-accent/50 border-b border-border last:border-0 cursor-pointer"
                                                                    onClick={() => router.push(`/invoices/${sale.facturaId}`)}
                                                                >
                                                                    <TableCell className="py-2 font-semibold text-foreground text-[11px] font-mono">{sale.facturaNumero}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] font-medium text-muted-foreground max-w-[140px] truncate">{sale.cliente}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-muted-foreground">{new Date(sale.fecha).toLocaleDateString('es-PA')}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-center font-bold text-foreground">{sale.cantidad} uds</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-right font-mono font-medium text-muted-foreground">{formatCurrency(sale.precio)}</TableCell>
                                                                    <TableCell className="py-2 text-[11px] text-right font-mono font-bold text-foreground pr-4">{formatCurrency(sale.total)}</TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground text-xs font-semibold">
                                                                    <Warehouse className="h-8 w-8 mx-auto opacity-20 mb-2 text-muted-foreground" />
                                                                    No hay ventas registradas para este producto.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* TAB: KIT / PRODUCTO COMPUESTO */}
                                    <TabsContent value="kit" forceMount className="mt-4 space-y-4 outline-none data-[state=inactive]:hidden">
                                        <KitTab productoId={product.id} initialEsKit={product.esKit} />
                                    </TabsContent>

                                    {/* TAB: RECETA E INSUMOS
                                        Las dos caras del mismo producto en un solo lugar: qué consume cuando se
                                        fabrica (receta) y dónde se compra cuando es materia prima (proveedores).
                                        Sin forceMount a propósito: no contiene campos del <form> de producto y
                                        montarlo siempre dispararía sus consultas en cada visita a la ficha. */}
                                    <TabsContent value="receta" className="mt-4 space-y-6 outline-none">
                                        {/* Se pasan los valores del formulario en vivo (no los guardados) para
                                            que el margen se recalcule mientras se cambia el precio. */}
                                        <RecetaTab
                                            productoId={product.id}
                                            unidadProducto={unidadMedida}
                                            precioVenta={parseFloat(precioVenta) || 0}
                                        />

                                        <div className="space-y-2 pt-2 border-t border-border">
                                            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pt-3">
                                                Dónde comprar este insumo
                                            </h3>
                                            <PresentacionesInsumo
                                                modo="producto"
                                                productoId={product.id}
                                                unidadProducto={unidadMedida}
                                            />
                                        </div>
                                    </TabsContent>

                                    {/* TAB 4: MULTIMEDIA */}
                                    {/* forceMount es obligatorio aquí: el input hidden "imagenUrl" vive en esta
                                        pestaña y sin esto se perdía al guardar desde cualquier otra pestaña. */}
                                    <TabsContent value="multimedia" forceMount className="mt-2 space-y-6 outline-none data-[state=inactive]:hidden">
                                        <input type="hidden" name="imagenUrl" value={imagenUrl} />
                                        
                                        {/* Upload Widget */}
                                        <div className="border border-dashed border-border rounded-xl p-6 text-center bg-muted/50 hover:bg-muted transition-colors relative cursor-pointer group">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                multiple
                                                onChange={handleUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground group-hover:text-brand-1 transition-colors mb-2" />
                                            <span className="text-xs font-bold text-foreground block">Subir imágenes para la galería del producto</span>
                                            <span className="text-[10px] text-muted-foreground block mt-1">Soporta selección múltiple de archivos PNG, JPG o WebP</span>
                                        </div>

                                        {/* Images Grid */}
                                        <div className="space-y-3">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Galería de Imágenes ({images.length})</Label>
                                            
                                            {images.length === 0 ? (
                                                <div className="border rounded-xl p-8 text-center text-muted-foreground bg-card">
                                                    <ImageIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                                                    <p className="text-xs font-semibold">No hay imágenes en la galería para este producto.</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Usa el selector de arriba para agregar imágenes locales.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                    {images.map((img, idx) => (
                                                        <Card key={img.id} className={cn(
                                                            "relative group overflow-hidden border shadow-sm flex flex-col justify-between bg-card",
                                                            img.isPrimary ? "border-brand-1 ring-1 ring-brand-1/25" : "border-border"
                                                        )}>
                                                            {/* Image content */}
                                                            <div className="aspect-square bg-muted flex items-center justify-center p-2 relative">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img 
                                                                    src={img.imageUrl} 
                                                                    alt={descripcion || 'Imagen del producto'} 
                                                                    className="max-h-full max-w-full object-contain rounded"
                                                                />
                                                                
                                                                {/* Primary Badge */}
                                                                {img.isPrimary && (
                                                                    <Badge className="absolute top-2 left-2 bg-brand-1 hover:bg-brand-1 text-white text-[8px] font-extrabold px-1.5 py-0.5 uppercase tracking-wider shadow">
                                                                        Principal
                                                                    </Badge>
                                                                )}

                                                                {/* Index Badge */}
                                                                <span className="absolute top-2 right-2 bg-primary/60 text-white text-[9px] font-mono font-bold h-5 w-5 rounded-full flex items-center justify-center">
                                                                    {idx + 1}
                                                                </span>
                                                            </div>

                                                            {/* Actions Panel */}
                                                            <div className="p-2 border-t border-border bg-muted/20 flex flex-col gap-1.5 shrink-0">
                                                                {/* Sort Buttons */}
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        disabled={idx === 0}
                                                                        onClick={() => handleMove(idx, 'left')}
                                                                        className="h-7 flex-1 text-muted-foreground border-border"
                                                                        title="Mover Izquierda"
                                                                        aria-label="Mover imagen a la izquierda"
                                                                    >
                                                                        ←
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        disabled={idx === images.length - 1}
                                                                        onClick={() => handleMove(idx, 'right')}
                                                                        className="h-7 flex-1 text-muted-foreground border-border"
                                                                        title="Mover Derecha"
                                                                        aria-label="Mover imagen a la derecha"
                                                                    >
                                                                        →
                                                                    </Button>
                                                                </div>

                                                                {/* Primary & Delete */}
                                                                <div className="flex gap-1">
                                                                    {!img.isPrimary ? (
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            onClick={() => handleSetPrimary(img.id)}
                                                                            className="h-7 flex-1 text-[10px] font-bold text-info border-info/20 hover:bg-info-bg"
                                                                        >
                                                                            Principal
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="h-7 flex-1 text-[10px] font-bold text-brand-1 flex items-center justify-center bg-brand-1/5 rounded">
                                                                            Activa
                                                                        </span>
                                                                    )}
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => handleDelete(img.id)}
                                                                        className="h-7 w-7 text-destructive hover:text-white hover:bg-destructive border-destructive/20 hover:border-transparent p-0 flex items-center justify-center"
                                                                    >
                                                                        ✕
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* TAB 5: HISTORIAL DE CAMBIOS (AUDITORIA REAL) */}
                                    <TabsContent value="history" forceMount className="mt-4 outline-none space-y-4 data-[state=inactive]:hidden">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                                                <History className="h-4 w-4 text-muted-foreground" />
                                                <span>Auditoría de Registro</span>
                                            </div>

                                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                                {product.auditHistory && product.auditHistory.length > 0 ? (
                                                    product.auditHistory.map((log, _idx) => (
                                                        <div key={log.id} className="relative pl-6 pb-4 last:pb-0 border-l border-border last:border-transparent">
                                                            {/* Point Marker */}
                                                            <div className="absolute left-[-4.5px] top-1 h-2 w-2 rounded-full bg-brand-1 ring-4 ring-brand-1/10" />
                                                            
                                                            <div className="text-xs bg-muted rounded-xl p-3 border border-border space-y-1.5 shadow-sm">
                                                                <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
                                                                    <div className="flex items-center gap-1 font-bold text-foreground">
                                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                                        <span>{log.usuarioNombre}</span>
                                                                        <span className="text-muted-foreground">·</span>
                                                                        <span className="text-muted-foreground font-normal font-mono">{log.usuarioEmail}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 font-semibold text-muted-foreground">
                                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                                        <span>{new Date(log.createdAt).toLocaleString('es-PA')}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold text-foreground">
                                                                        Acción: {log.accion === 'crear' ? 'Creación de Producto' : log.accion === 'editar' ? 'Edición de Campos' : log.accion}
                                                                    </span>
                                                                    <Badge className={cn(
                                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded border-transparent",
                                                                        log.accion === 'crear' ? "bg-success-bg text-success" : "bg-brand-1/5 text-brand-1"
                                                                    )}>
                                                                        {log.accion.toUpperCase()}
                                                                    </Badge>
                                                                </div>

                                                                {/* Diff list */}
                                                                {log.datosAntes && log.datosDespues && (
                                                                    <div className="text-[10px] font-mono text-muted-foreground bg-card p-2 rounded-lg border border-border mt-1 space-y-1 leading-normal">
                                                                        {Object.keys(log.datosDespues as Record<string, unknown>).map((key) => {
                                                                            const before = (log.datosAntes as Record<string, unknown>)[key];
                                                                            const after = (log.datosDespues as Record<string, unknown>)[key];
                                                                            if (JSON.stringify(before) !== JSON.stringify(after)) {
                                                                                // Ignore metadata
                                                                                if (['updatedAt', 'createdAt'].includes(key)) return null;
                                                                                return (
                                                                                    <div key={key} className="flex flex-wrap gap-1">
                                                                                        <span className="font-bold text-foreground">{key}:</span>
                                                                                        <span className="text-danger line-through">{String(before || '—')}</span>
                                                                                        <span className="text-muted-foreground">→</span>
                                                                                        <span className="text-success font-bold">{String(after || '—')}</span>
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
                                                    <div className="text-center py-6 text-muted-foreground text-xs font-semibold">
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
                    <div className="xl:col-span-4 xl:sticky xl:top-[60px] self-start space-y-4">
                        
                        {/* Combined Summary & Metadata Card */}
                        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                            {images.length > 0 ? (
                                <div className="space-y-2 border-b border-border p-3 bg-muted/50">
                                    <div className="w-full h-40 flex items-center justify-center relative bg-card border rounded-lg p-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={activePreviewUrl || imagenUrl || "/placeholder-product.png"} 
                                            alt={descripcion || 'Producto'} 
                                            className="max-h-full max-w-full object-contain rounded transition-all duration-300"
                                        />
                                    </div>
                                    {images.length > 1 && (
                                        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                            {images.map((img) => (
                                                <button
                                                    key={img.id}
                                                    type="button"
                                                    onClick={() => setActivePreviewUrl(img.imageUrl)}
                                                    className={cn(
                                                        "h-10 w-10 rounded border overflow-hidden shrink-0 transition-all p-0.5 bg-card",
                                                        (activePreviewUrl || imagenUrl) === img.imageUrl 
                                                            ? "border-brand-1 scale-95 ring-1 ring-brand-1" 
                                                            : "border-border hover:border-brand-1/40"
                                                    )}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={img.imageUrl} className="h-full w-full object-cover rounded" alt="miniatura" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                imagenUrl && (
                                    <div className="w-full h-32 bg-muted border-b border-border flex items-center justify-center p-2 relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={imagenUrl} 
                                            alt={descripcion} 
                                            className="max-h-full max-w-full object-contain rounded"
                                        />
                                    </div>
                                )
                            )}
                            <CardHeader className="bg-muted border-b border-border py-3 px-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Package className="h-4.5 w-4.5 text-brand-1" />
                                    <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">Resumen de Ficha</CardTitle>
                                </div>
                                <span className="text-[10px] bg-muted text-muted-foreground font-bold px-1.5 py-0.5 rounded">
                                    {unidadMedida}
                                </span>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3.5 text-xs text-muted-foreground">
                                
                                {/* Lista de Precios e Impuestos */}
                                <div className="space-y-2">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Precio de Lista</span>
                                        <span className="text-2xl font-extrabold text-foreground font-mono">
                                            {formatearMoneda(priceNum)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-border">
                                        <span className="text-muted-foreground">Costo Base:</span>
                                        <span className="font-semibold text-foreground font-mono">{formatearMoneda(costNum)}</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-border">
                                        <span className="text-muted-foreground">ITBMS Aplicado:</span>
                                        <span className="font-semibold text-foreground font-mono">+{formatearMoneda(parseFloat(itbmsEstimado))}</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-border">
                                        <span className="text-muted-foreground">Precio con Impuesto:</span>
                                        <span className="font-semibold text-foreground font-mono">{formatearMoneda(parseFloat(precioConImpuestos))}</span>
                                    </div>
                                </div>

                                <div className="h-px bg-muted w-full" />

                                {/* Rentabilidad Widget */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Rentabilidad:</span>
                                        <span className="font-bold text-success font-mono">+{formatearMoneda(parseFloat(rentabilidad))}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Margen Bruto:</span>
                                        <Badge className="bg-success-bg text-success border-transparent hover:bg-success-bg text-[10px] font-bold px-2 py-0.5 rounded">
                                            {formatearPorcentaje(parseFloat(margin))}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="h-px bg-muted w-full" />

                                {/* Stock Widget */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Estado de Stock:</span>
                                        {unidadMedida === 'SRV' ? (
                                            <Badge className="text-[10px] font-bold px-2 py-0.5 rounded border-transparent bg-info-bg text-info hover:bg-info-bg">
                                                Servicio (sin inventario)
                                            </Badge>
                                        ) : (
                                            <Badge className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded border-transparent",
                                                stockActualNum <= 0
                                                    ? "bg-danger-bg text-danger hover:bg-danger-bg"
                                                    : stockActualNum < stockMinimoNum
                                                    ? "bg-warning-bg text-warning hover:bg-warning-bg"
                                                    : "bg-success-bg text-success hover:bg-success-bg"
                                            )}>
                                                {stockActualNum <= 0 ? 'Agotado' : stockActualNum < stockMinimoNum ? 'Bajo Stock' : 'Saludable'}
                                            </Badge>
                                        )}
                                    </div>
                                    {unidadMedida !== 'SRV' && (
                                        <div className="space-y-1">
                                            <Progress value={stockPercentage} className="h-2 bg-muted [&>div]:bg-brand-1" />
                                            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                                                <span>Mínimo: {stockMinimoNum}</span>
                                                <span className="text-muted-foreground font-bold">{stockActualNum} uds</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-muted w-full" />

                                {/* Metadata Fechas */}
                                <div className="space-y-1.5 text-muted-foreground pt-0.5">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            Creado:
                                        </span>
                                        <span className="font-semibold text-foreground">{new Date(product.createdAt).toLocaleDateString('es-PA')}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <History className="h-3.5 w-3.5" />
                                            Modificado:
                                        </span>
                                        <span className="font-semibold text-foreground">{new Date(product.updatedAt).toLocaleDateString('es-PA')}</span>
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

interface KitComponenteRow {
    productoComponenteId: string;
    cantidad: number;
    descripcion: string;
    costoUnitario: number;
}

function KitTab({ productoId, initialEsKit }: { productoId: string; initialEsKit: boolean }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [esKitEnabled, setEsKitEnabled] = useState(initialEsKit);
    const [hadActiveKit, setHadActiveKit] = useState(false);
    const [componentes, setComponentes] = useState<KitComponenteRow[]>([]);
    const [productosDisponibles, setProductosDisponibles] = useState<{ id: string; codigoInterno: string; descripcion: string; costoUnitario: number }[]>([]);
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        Promise.all([
            getKitDeProducto(productoId),
            getProductosParaKit(productoId)
        ]).then(([kit, productos]) => {
            if (kit) {
                setEsKitEnabled(kit.activo);
                setHadActiveKit(kit.activo);
                setComponentes(kit.componentes.map((c) => ({
                    productoComponenteId: c.productoComponenteId,
                    cantidad: c.cantidad,
                    descripcion: c.descripcion,
                    costoUnitario: c.costoUnitario,
                })));
            }
            setProductosDisponibles(productos);
            setLoading(false);
        });
    }, [productoId]);

    const filteredProductos = productosDisponibles.filter((p) =>
        !componentes.some((c) => c.productoComponenteId === p.id) &&
        (!search || p.descripcion.toLowerCase().includes(search.toLowerCase()) || p.codigoInterno.toLowerCase().includes(search.toLowerCase()))
    );

    const addComponente = (p: { id: string; codigoInterno: string; descripcion: string; costoUnitario: number }) => {
        setComponentes((prev) => [...prev, { productoComponenteId: p.id, cantidad: 1, descripcion: p.descripcion, costoUnitario: p.costoUnitario }]);
        setSearch('');
        setShowSearch(false);
    };

    const removeComponente = (productoComponenteId: string) => {
        setComponentes((prev) => prev.filter((c) => c.productoComponenteId !== productoComponenteId));
    };

    const updateCantidad = (productoComponenteId: string, cantidad: number) => {
        setComponentes((prev) => prev.map((c) => c.productoComponenteId === productoComponenteId ? { ...c, cantidad } : c));
    };

    const costoTotalKit = componentes.reduce((sum, c) => sum + (c.costoUnitario * (c.cantidad || 0)), 0);

    const handleGuardar = async () => {
        setSaving(true);
        try {
            if (esKitEnabled) {
                if (componentes.length === 0) {
                    toast.error('Agrega al menos un componente antes de guardar.');
                    return;
                }
                const res = await crearOActualizarKit(
                    productoId,
                    componentes.map((c) => ({ productoComponenteId: c.productoComponenteId, cantidad: c.cantidad }))
                );
                if (res.success) {
                    toast.success(res.message);
                    setHadActiveKit(true);
                } else {
                    toast.error(res.error || 'Error al guardar el kit.');
                }
            } else if (hadActiveKit) {
                const res = await desactivarKit(productoId);
                if (res.success) {
                    toast.success(res.message);
                    setHadActiveKit(false);
                } else {
                    toast.error(res.error || 'Error al desactivar el kit.');
                }
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-1" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="esKitToggle" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">¿Este producto es un kit?</Label>
                <Select value={esKitEnabled ? 'true' : 'false'} onValueChange={(v) => setEsKitEnabled(v === 'true')}>
                    <SelectTrigger id="esKitToggle" className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full sm:w-1/2">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                        <SelectItem value="false" className="text-xs sm:text-sm cursor-pointer">No, es un producto normal</SelectItem>
                        <SelectItem value="true" className="text-xs sm:text-sm cursor-pointer">Sí, es un kit / producto compuesto</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {esKitEnabled && (
                <>
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Componentes del Kit</Label>

                        {showSearch ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar producto componente..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8 h-10 text-xs sm:text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div className="border border-border rounded-lg max-h-48 overflow-auto bg-card shadow-sm">
                                    {filteredProductos.length > 0 ? filteredProductos.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => addComponente(p)}
                                            className="w-full px-3 py-2 text-left hover:bg-accent flex justify-between items-center border-b last:border-0 border-border"
                                        >
                                            <span className="text-xs font-medium text-foreground">{p.descripcion} <span className="text-muted-foreground font-mono">({p.codigoInterno})</span></span>
                                            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(p.costoUnitario)}</span>
                                        </button>
                                    )) : (
                                        <div className="p-3 text-xs text-muted-foreground text-center">No se encontraron productos disponibles (los kits no pueden usarse como componentes).</div>
                                    )}
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowSearch(false); setSearch(''); }} className="h-8 text-xs">
                                    Cancelar
                                </Button>
                            </div>
                        ) : (
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowSearch(true)} className="h-9 text-xs font-bold">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Agregar Componente
                            </Button>
                        )}
                    </div>

                    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase">Componente</TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-center w-28">Cantidad</TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-right">Costo Unit.</TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-right">Subtotal</TableHead>
                                    <TableHead className="h-9 w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {componentes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-20 text-center text-muted-foreground text-xs font-semibold">
                                            Aún no has agregado componentes a este kit.
                                        </TableCell>
                                    </TableRow>
                                ) : componentes.map((c) => (
                                    <TableRow key={c.productoComponenteId} className="border-b border-border last:border-0">
                                        <TableCell className="py-2 text-xs font-medium text-foreground">{c.descripcion}</TableCell>
                                        <TableCell className="py-2 text-center">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={c.cantidad}
                                                onChange={(e) => updateCantidad(c.productoComponenteId, parseInt(e.target.value) || 1)}
                                                className="h-8 text-xs text-center w-20 mx-auto"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-right font-mono text-muted-foreground">{formatCurrency(c.costoUnitario)}</TableCell>
                                        <TableCell className="py-2 text-xs text-right font-mono font-bold text-foreground">{formatCurrency(c.costoUnitario * c.cantidad)}</TableCell>
                                        <TableCell className="py-2 text-right">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeComponente(c.productoComponenteId)} className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label={`Quitar componente ${c.descripcion}`}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="bg-muted rounded-xl p-3 border border-border flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Costo total del kit (referencia)</span>
                        <span className="text-sm font-bold text-brand-1 font-mono">{formatCurrency(costoTotalKit)}</span>
                    </div>
                </>
            )}

            {!esKitEnabled && hadActiveKit && (
                <Alert variant="error" className="text-xs font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>Al guardar, este kit se desactivará (no se borra el historial de ventas que ya lo referencian).</span>
                </Alert>
            )}

            <Button
                type="button"
                onClick={handleGuardar}
                disabled={saving || (!esKitEnabled && !hadActiveKit)}
                className="h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs"
            >
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                Guardar Kit
            </Button>
        </div>
    );
}
