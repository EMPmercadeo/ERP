'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Loader2,
    Plus,
    Trash2,
    Search,
    User,
    Package,
    AlertTriangle,
    X,
    Zap
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { createInvoice } from '@/lib/actions/invoices';
import { purchaseDocumentBlock } from '@/lib/actions/billing';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

// Interfaces for Props
export interface ClientOption {
    id: string;
    razonSocial: string;
    ruc: string;
}

export interface ProductOption {
    id: string;
    codigo: string;
    descripcion: string;
    precio: number;
    itbms: string;
}

interface InvoiceItem {
    id: string;
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    codigoTasaItbms: string;
    subtotal: number;
    itbms: number;
    total: number;
}

const itbmsRates: Record<string, number> = {
    '00': 0,
    '01': 0.07,
    '02': 0.10,
    '03': 0.15,
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

const initialState = {
    message: '',
    errors: {},
};

export function InvoiceForm({ 
    clients, 
    products,
    companyId,
    remainingDocuments = 10
}: { 
    clients: ClientOption[]; 
    products: ProductOption[];
    companyId: string;
    remainingDocuments: number;
}) {
    const router = useRouter();
    const [state, formAction] = useFormState(createInvoice, initialState);

    // Billing and Limits state
    const [currentRemaining, setCurrentRemaining] = useState(remainingDocuments);
    const [showPurchaseBlockModal, setShowPurchaseBlockModal] = useState(false);
    const [selectedBlockSize, setSelectedBlockSize] = useState<number>(100);
    const [isPurchasingBlock, setIsPurchasingBlock] = useState(false);

    // Form state
    const [clienteId, setClienteId] = useState('');
    const [condicionPago, setCondicionPago] = useState('contado');
    const [observaciones, setObservaciones] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);

    // Product search
    const [productSearch, setProductSearch] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);

    // Client search
    const [clientSearch, setClientSearch] = useState('');

    const filteredProducts = useMemo(() => {
        if (!productSearch) return products; // Show all if no search
        return products.filter(p =>
            p.descripcion.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.codigo.toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [productSearch, products]);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        return clients.filter(c =>
            c.razonSocial.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.ruc.toLowerCase().includes(clientSearch.toLowerCase())
        ).slice(0, 8);
    }, [clientSearch, clients]);

    const handlePurchaseBlock = async () => {
        setIsPurchasingBlock(true);
        try {
            const res = await purchaseDocumentBlock(companyId, selectedBlockSize);
            if (res.success) {
                toast.success(res.message);
                setCurrentRemaining(prev => prev + selectedBlockSize);
                setShowPurchaseBlockModal(false);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Error al procesar la compra del bloque de documentos.');
        } finally {
            setIsPurchasingBlock(false);
        }
    };

    const selectedClient = clients.find(c => c.id === clienteId);

    // Calculate totals
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const itbms = items.reduce((sum, item) => sum + item.itbms, 0);
        const total = items.reduce((sum, item) => sum + item.total, 0);
        return { subtotal, itbms, total };
    }, [items]);

    const addProduct = (product: ProductOption) => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            productoId: product.id,
            descripcion: product.descripcion,
            cantidad: 1,
            precioUnitario: product.precio,
            codigoTasaItbms: product.itbms,
            subtotal: product.precio,
            itbms: product.precio * itbmsRates[product.itbms],
            total: product.precio * (1 + itbmsRates[product.itbms]),
        };
        setItems([...items, newItem]);
        setShowProductSearch(false);
        setProductSearch('');
    };

    const updateItemQuantity = (id: string, cantidad: number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const subtotal = item.precioUnitario * cantidad;
                const itbms = subtotal * itbmsRates[item.codigoTasaItbms];
                return {
                    ...item,
                    cantidad,
                    subtotal,
                    itbms,
                    total: subtotal + itbms,
                };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <ContentContainer>
            <div className="space-y-6">
                {/* Back link */}
                <Link href="/invoices" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver a Facturas
                </Link>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Nueva Factura Electrónica</h2>
                        <p className="text-muted-foreground">
                            Crea una nueva factura para enviar a la DGI
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                        Borrador
                    </Badge>
                </div>

                {state?.message && (
                    <Alert variant="error">{state.message}</Alert>
                )}

                {currentRemaining <= 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in duration-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-950 text-sm">Límite mensual de facturación alcanzado</h4>
                                <p className="text-xs text-amber-900/80 mt-0.5">
                                    Has agotado los documentos de facturación electrónica incluidos en tu plan para este mes.
                                    Para continuar facturando y timbrando con la DGI, adquiere un bloque adicional o actualiza tu plan.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                                onClick={() => setShowPurchaseBlockModal(true)}
                            >
                                <Zap className="h-3.5 w-3.5 mr-1.5 fill-white" />
                                Comprar Bloque
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-amber-200 text-amber-800 hover:bg-amber-100/50 text-xs font-semibold"
                                asChild
                            >
                                <Link href="/settings">
                                    Ver Planes
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form action={formAction}>
                    {/* Hidden Input for Items JSON */}
                    <input type="hidden" name="items" value={JSON.stringify(items)} />
                    {/* Hidden Input for Client ID (explicit control) */}
                    <input type="hidden" name="clienteId" value={clienteId} />

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left column - Client & Items */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Cliente */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Cliente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!clienteId ? (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    placeholder="Buscar cliente por nombre o RUC..."
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                    className={`pl-8 ${state?.errors?.clienteId ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                            {clientSearch && (
                                                <div className="border rounded-lg max-h-48 overflow-auto bg-white z-10 shadow-md divide-y">
                                                    {filteredClients.length > 0 ? (
                                                        filteredClients.map(client => (
                                                            <button
                                                                key={client.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setClienteId(client.id);
                                                                    setClientSearch('');
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex justify-between items-center"
                                                            >
                                                                <div>
                                                                    <div className="font-medium text-slate-800 text-sm">{client.razonSocial}</div>
                                                                    <div className="text-xs text-slate-500">RUC: {client.ruc}</div>
                                                                </div>
                                                                <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Elegir</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-sm text-muted-foreground text-center">
                                                            No se encontraron clientes
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {state?.errors?.clienteId && (
                                                <p className="text-xs text-destructive mt-1">{state.errors.clienteId[0]}</p>
                                            )}
                                        </div>
                                    ) : (
                                        selectedClient && (
                                            <div className="p-4 border rounded-xl bg-slate-50 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                                                        {selectedClient.razonSocial.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{selectedClient.razonSocial}</h4>
                                                        <p className="text-xs text-slate-500">RUC: {selectedClient.ruc}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setClienteId('')}
                                                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                >
                                                    Cambiar Cliente
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>

                            {/* Items */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        Productos / Servicios
                                    </CardTitle>
                                    <CardDescription>
                                        Agrega los productos o servicios a facturar
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Add product button/search */}
                                    {showProductSearch ? (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Buscar producto..."
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    className="pl-8"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="border rounded-lg max-h-48 overflow-auto bg-white z-10 shadow-md">
                                                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => addProduct(product)}
                                                        className="w-full px-3 py-2 text-left hover:bg-accent flex justify-between items-center border-b last:border-0"
                                                    >
                                                        <span>{product.descripcion}</span>
                                                        <span className="text-muted-foreground">{formatCurrency(product.precio)}</span>
                                                    </button>
                                                )) : (
                                                    <div className="p-3 text-sm text-muted-foreground text-center">
                                                        {products.length === 0 ? "No hay productos registrados" : "No se encontraron productos"}
                                                    </div>
                                                )}
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowProductSearch(false)}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button type="button" variant="outline" onClick={() => setShowProductSearch(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar Producto
                                        </Button>
                                    )}

                                    {state?.errors?.items && <p className="text-xs text-destructive">{state.errors.items[0]}</p>}

                                    {/* Items table */}
                                    {items.length > 0 && (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="w-24">Cant.</TableHead>
                                                    <TableHead className="text-right">Precio</TableHead>
                                                    <TableHead className="text-right">ITBMS</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                    <TableHead className="w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={item.cantidad}
                                                                onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                                className="w-20"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.itbms)}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem(item.id)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right column - Summary */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Condiciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Condición de Pago
                                        </label>
                                        <Select name="condicionPago" value={condicionPago} onValueChange={setCondicionPago}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="contado">Contado</SelectItem>
                                                <SelectItem value="credito_15">Crédito 15 días</SelectItem>
                                                <SelectItem value="credito_30">Crédito 30 días</SelectItem>
                                                <SelectItem value="credito_60">Crédito 60 días</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Observaciones
                                        </label>
                                        <Textarea
                                            name="observaciones"
                                            placeholder="Notas adicionales..."
                                            rows={3}
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Totals */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resumen</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">ITBMS</span>
                                        <span>{formatCurrency(totals.itbms)}</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">{formatCurrency(totals.total)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <SubmitButton disabled={items.length === 0 || currentRemaining <= 0} />
                                <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal de Compra de Bloques de Documentos desde Formulario */}
            {showPurchaseBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setShowPurchaseBlockModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            disabled={isPurchasingBlock}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-900">Comprar Bloque de Documentos</h3>
                                <p className="text-xs text-muted-foreground mt-1">Adquiere folios electrónicos adicionales para poder timbrar esta factura inmediatamente.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-muted-foreground">Seleccionar Tamaño del Bloque</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { size: 100, price: 5.00, label: '100 docs' },
                                        { size: 500, price: 25.00, label: '500 docs' },
                                        { size: 1000, price: 50.00, label: '1,000 docs' }
                                    ].map((block) => (
                                        <button
                                            key={block.size}
                                            type="button"
                                            onClick={() => setSelectedBlockSize(block.size)}
                                            className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                                                selectedBlockSize === block.size
                                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-600/10'
                                                    : 'border-border bg-white text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{block.label}</span>
                                            <span className="text-xs font-semibold text-indigo-600">${block.price.toFixed(2)}</span>
                                            <span className="text-[9px] text-muted-foreground">($0.05 c/u)</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-indigo-50/30 border border-indigo-100 rounded-lg p-4 space-y-2 text-xs text-indigo-950/80">
                                <div className="flex justify-between font-semibold">
                                    <span>Costo del Bloque</span>
                                    <span>${(selectedBlockSize * 0.05).toFixed(2)} USD</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Precio por documento</span>
                                    <span>$0.05 USD</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground border-t pt-2 mt-1">
                                    * Al confirmar el pago, los folios se acreditarán a tu cuenta de inmediato y podrás guardar tu factura sin salir del formulario.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    onClick={handlePurchaseBlock}
                                    disabled={isPurchasingBlock}
                                    className="w-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold py-5 flex items-center justify-center gap-2 border-none shadow-sm hover:shadow-md"
                                >
                                    {isPurchasingBlock ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="italic font-extrabold text-lg">PayPal</span>
                                            <span className="text-sm font-semibold tracking-wider">COMPRAR AHORA (Simulado)</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowPurchaseBlockModal(false)}
                                    disabled={isPurchasingBlock}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ContentContainer>
    );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled} className="w-full">
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                </>
            ) : (
                <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar y Timbrar
                </>
            )}
        </Button>
    );
}
