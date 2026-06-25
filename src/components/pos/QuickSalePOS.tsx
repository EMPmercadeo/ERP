'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    X,
    User,
    DollarSign,
    Check,
    Loader2,
    Package,
    ArrowLeft,
    Share2,
    MessageSquare,
    Mail,
    Printer,
    Eye,
    ChevronUp,
    ChevronDown,
    Zap,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ContentContainer } from '@/components/layout/Content';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createInvoicePOS } from '@/lib/actions/invoices';
import { formatCurrency } from '@/lib/utils/currency';

interface ClientOption {
    id: string;
    razonSocial: string;
    ruc: string;
}

interface ProductOption {
    id: string;
    codigo: string;
    descripcion: string;
    precio: number;
    itbms: string;
    stock: number;
    imagenUrl?: string | null;
}

interface CartItem {
    product: ProductOption;
    quantity: number;
}

const itbmsRates: Record<string, number> = {
    '00': 0.00,
    '01': 0.07,
    '02': 0.10,
    '03': 0.15,
};

export function QuickSalePOS({
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
    
    // POS Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Checkout states
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [clienteId, setClienteId] = useState('');
    const [condicionPago, setCondicionPago] = useState('contado');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [clientSearch, setClientSearch] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    
    // Success State
    const [successInvoice, setSuccessInvoice] = useState<{
        id: string;
        numeroCompleto: string;
        totalNeto: number;
    } | null>(null);

    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    // Set default client (Consumidor Final) if available
    useEffect(() => {
        const defaultClient = clients.find(c => 
            c.razonSocial.toLowerCase().includes('consumidor final') || 
            c.ruc === '8-NT-8-8' || 
            c.ruc === '00'
        ) || clients[0];
        
        if (defaultClient) {
            setClienteId(defaultClient.id);
        }
    }, [clients]);

    // Filter products by search query
    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.codigo.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        return clients.filter(c => 
            c.razonSocial.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.ruc.toLowerCase().includes(clientSearch.toLowerCase())
        ).slice(0, 5);
    }, [clients, clientSearch]);

    const selectedClient = clients.find(c => c.id === clienteId);

    // Cart calculations
    const totals = useMemo(() => {
        let subtotal = 0;
        let itbms = 0;
        
        cart.forEach(item => {
            const itemSubtotal = item.product.precio * item.quantity;
            const rate = itbmsRates[item.product.itbms] || 0;
            subtotal += itemSubtotal;
            itbms += itemSubtotal * rate;
        });
        
        return {
            subtotal,
            itbms,
            total: subtotal + itbms,
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
        };
    }, [cart]);

    // Add to cart
    const addToCart = (product: ProductOption) => {
        if (product.stock <= 0) {
            toast.error('Este producto no tiene stock disponible.');
            return;
        }

        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                toast.error(`No puedes agregar más de ${product.stock} unidades (stock disponible).`);
                return;
            }
            setCart(cart.map(item => 
                item.product.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
        toast.success(`Agregado: ${product.descripcion}`, { duration: 1000 });
    };

    // Remove or decrease quantity
    const decreaseQuantity = (productId: string) => {
        const existingItem = cart.find(item => item.product.id === productId);
        if (!existingItem) return;

        if (existingItem.quantity === 1) {
            setCart(cart.filter(item => item.product.id !== productId));
        } else {
            setCart(cart.map(item => 
                item.product.id === productId 
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            ));
        }
    };

    // Increase quantity
    const increaseQuantity = (item: CartItem) => {
        if (item.quantity >= item.product.stock) {
            toast.error(`Límite de stock alcanzado (${item.product.stock} unidades).`);
            return;
        }
        setCart(cart.map(i => 
            i.product.id === item.product.id 
                ? { ...i, quantity: i.quantity + 1 }
                : i
        ));
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Tu carrito está vacío.');
            return;
        }
        if (!clienteId) {
            toast.error('Por favor, selecciona un cliente para facturar.');
            return;
        }
        if (remainingDocuments <= 0) {
            toast.error('Límite de documentos mensuales alcanzado.');
            return;
        }

        setIsCheckingOut(true);
        try {
            const itemsPayload = cart.map(item => ({
                productoId: item.product.id,
                descripcion: item.product.descripcion,
                cantidad: item.quantity,
                precioUnitario: item.product.precio,
                codigoTasaItbms: item.product.itbms
            }));

            const res = await createInvoicePOS({
                clienteId,
                condicionPago,
                metodoPago,
                items: itemsPayload
            });

            if (res.success && res.invoice) {
                toast.success('¡Venta realizada con éxito!');
                setSuccessInvoice({
                    id: res.invoice.id,
                    numeroCompleto: res.invoice.numeroCompleto,
                    totalNeto: res.invoice.totalNeto
                });
                setCart([]);
                setShowCheckoutModal(false);
            } else {
                toast.error(res.error || 'Error al procesar la venta.');
            }
        } catch (error) {
            toast.error('Error de red al procesar la venta.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    // Shared links setup
    const shareText = successInvoice
        ? `Hola, adjunto su recibo/factura ${successInvoice.numeroCompleto} por un total de ${formatCurrency(successInvoice.totalNeto)}. Puede ver su comprobante aquí: ${baseUrl}/invoices/${successInvoice.id}`
        : '';
    const whatsappUrl = successInvoice
        ? `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
        : '#';
    const emailUrl = successInvoice
        ? `mailto:?subject=${encodeURIComponent(`Factura Electrónica ${successInvoice.numeroCompleto}`)}&body=${encodeURIComponent(shareText)}`
        : '#';

    return (
        <ContentContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans pb-24 lg:pb-0">
                {/* Products Section (Left 2 cols on desktop) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por código o nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 pl-9 bg-white border-slate-200 focus-visible:ring-brand-1 rounded-xl text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => {
                                const cartItem = cart.find(item => item.product.id === product.id);
                                const cartQty = cartItem ? cartItem.quantity : 0;
                                const isAgotado = product.stock <= 0;
                                
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => !isAgotado && addToCart(product)}
                                        className={`bg-white border rounded-2xl p-2.5 flex flex-col justify-between shadow-sm relative transition-all select-none ${
                                            isAgotado 
                                                ? 'opacity-60 cursor-not-allowed border-slate-100' 
                                                : 'hover:border-slate-300 hover:shadow active:scale-[0.97] cursor-pointer border-slate-100'
                                        }`}
                                    >
                                        {/* Cart Quantity Badge Indicator */}
                                        {cartQty > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-brand-1 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md animate-in scale-in">
                                                {cartQty}
                                            </span>
                                        )}

                                        <div>
                                            {/* Image */}
                                            <div className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-2 border border-slate-100 relative">
                                                {product.imagenUrl ? (
                                                    <img src={product.imagenUrl} alt={product.descripcion} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="h-8 w-8 text-slate-300" />
                                                )}
                                                
                                                {/* ITBMS Badge */}
                                                <span className="absolute bottom-1.5 left-1.5 bg-white/95 text-slate-800 backdrop-blur-sm text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-200/50 shadow-sm leading-none">
                                                    {product.itbms === '00' ? 'Exento' : `ITBMS ${product.itbms === '01' ? '7%' : product.itbms === '02' ? '10%' : '15%'}`}
                                                </span>
                                            </div>

                                            {/* SKU */}
                                            <span className="font-mono text-[9px] font-bold text-slate-400 block tracking-tight truncate">
                                                {product.codigo}
                                            </span>

                                            {/* Name */}
                                            <h4 className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2 mt-0.5 min-h-[2rem]">
                                                {product.descripcion}
                                            </h4>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                                            <span className="font-mono text-xs font-extrabold text-slate-800">
                                                {formatCurrency(product.precio)}
                                            </span>
                                            
                                            {isAgotado ? (
                                                <Badge className="bg-red-50 text-red-600 border-transparent text-[8px] font-bold px-1.5 py-0">Agotado</Badge>
                                            ) : product.stock < 10 ? (
                                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                                                    {product.stock} uds
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                                    Stock: {product.stock}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-2 py-12 text-center text-xs text-slate-400 font-semibold">
                                No se encontraron productos.
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Cart Section (Right 1 col on desktop) */}
                <div className="hidden lg:block lg:col-span-1 space-y-4">
                    <Card className="border border-slate-100 shadow-sm rounded-2xl h-[calc(100vh-210px)] flex flex-col justify-between overflow-hidden">
                        <div className="flex flex-col flex-1 min-h-0">
                            <CardHeader className="py-3 px-4 border-b border-slate-100 shrink-0">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-brand-1" />
                                    Detalle del Carrito
                                </CardTitle>
                            </CardHeader>
                            
                            {/* Cart items scroll area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.length > 0 ? (
                                    cart.map(item => (
                                        <div key={item.product.id} className="flex items-center gap-3 border-b border-slate-100/60 pb-3 last:border-0">
                                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50 overflow-hidden">
                                                {item.product.imagenUrl ? (
                                                    <img src={item.product.imagenUrl} alt={item.product.descripcion} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-[11px] font-bold text-slate-800 truncate" title={item.product.descripcion}>
                                                    {item.product.descripcion}
                                                </h5>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatCurrency(item.product.precio)} c/u</p>
                                            </div>
                                            
                                            {/* Quantity control */}
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7 rounded-lg"
                                                    onClick={() => decreaseQuantity(item.product.id)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7 rounded-lg"
                                                    onClick={() => increaseQuantity(item)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                        <ShoppingCart className="h-10 w-10 text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400 font-semibold">Agrega productos tocando la cuadrícula de la izquierda</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart Summary & Checkout */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>ITBMS</span>
                                    <span className="font-mono">{formatCurrency(totals.itbms)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200/50 pt-2 text-sm font-bold text-slate-900">
                                    <span>Total a Pagar</span>
                                    <span className="font-mono text-brand-1 text-base">{formatCurrency(totals.total)}</span>
                                </div>
                            </div>
                            
                            <Button
                                className="w-full h-11 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs rounded-xl shadow-sm"
                                disabled={cart.length === 0}
                                onClick={() => setShowCheckoutModal(true)}
                            >
                                Proceder al Pago ({totals.itemCount} items)
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Mobile Floating Drawer bar */}
                <div className="fixed bottom-16 left-0 right-0 z-30 lg:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.06)] font-sans">
                    <button
                        onClick={() => cart.length > 0 && setIsCartOpen(!isCartOpen)}
                        className="flex items-center gap-2 text-left bg-slate-50 border border-slate-100 px-3.5 py-2.5 rounded-xl active:scale-95 transition-all select-none"
                    >
                        <div className="relative shrink-0">
                            <ShoppingCart className="h-5 w-5 text-brand-1" />
                            {totals.itemCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 h-4 w-4 bg-brand-1 text-white font-bold text-[9px] rounded-full flex items-center justify-center border border-white shadow-sm">
                                    {totals.itemCount}
                                </span>
                            )}
                        </div>
                        <div className="leading-none">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ver Detalle</span>
                            <span className="font-mono font-bold text-xs text-slate-800">{formatCurrency(totals.total)}</span>
                        </div>
                        {cart.length > 0 && (
                            isCartOpen ? <ChevronDown className="h-4 w-4 text-slate-400 ml-1" /> : <ChevronUp className="h-4 w-4 text-slate-400 ml-1" />
                        )}
                    </button>
                    
                    <Button
                        className="h-11 px-6 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs rounded-xl shadow-sm"
                        disabled={cart.length === 0}
                        onClick={() => setShowCheckoutModal(true)}
                    >
                        Pagar ({totals.itemCount} ítems)
                    </Button>
                </div>
            </div>

            {/* Mobile slide-up Cart detail Drawer */}
            {isCartOpen && cart.length > 0 && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in">
                    <div className="fixed bottom-32 left-0 right-0 bg-white border-t rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col font-sans pb-2">
                        <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50/50">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ShoppingCart className="h-4 w-4 text-brand-1" />
                                Artículos Agregados
                            </h4>
                            <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex items-center gap-3 border-b border-slate-100/60 pb-3 last:border-0">
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border overflow-hidden">
                                        {item.product.imagenUrl ? (
                                            <img src={item.product.imagenUrl} alt={item.product.descripcion} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="h-5 w-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-[11px] font-bold text-slate-800 truncate">{item.product.descripcion}</h5>
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatCurrency(item.product.precio)} c/u</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 rounded-lg"
                                            onClick={() => decreaseQuantity(item.product.id)}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 rounded-lg"
                                            onClick={() => increaseQuantity(item)}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Form Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setShowCheckoutModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            disabled={isCheckingOut}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Procesar Venta POS</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Completa los datos del cobro para emitir el comprobante oficial.
                                </p>
                            </div>

                            {/* Summary alert of totals */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal:</span>
                                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">ITBMS:</span>
                                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(totals.itbms)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800 pt-2 mt-1">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">Total a Cobrar:</span>
                                    <span className="font-mono font-bold text-brand-1 dark:text-blue-400 text-base">{formatCurrency(totals.total)}</span>
                                </div>
                            </div>

                            {/* Form fields */}
                            <div className="space-y-4">
                                {/* Cliente */}
                                <div className="space-y-1.5">
                                    <label htmlFor="clientPOS" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Cliente / Razón Social
                                    </label>
                                    
                                    {!selectedClient ? (
                                        <div className="space-y-1">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Buscar cliente..."
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                    className="h-10 pl-8 bg-slate-50/50 border-slate-200 rounded-lg text-sm w-full"
                                                />
                                            </div>
                                            {clientSearch && (
                                                <div className="border rounded-lg max-h-40 overflow-auto bg-white divide-y shadow-sm">
                                                    {filteredClients.length > 0 ? (
                                                        filteredClients.map(c => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setClienteId(c.id);
                                                                    setClientSearch('');
                                                                }}
                                                                className="w-full px-3 py-2 text-left hover:bg-slate-50 text-xs flex justify-between items-center"
                                                            >
                                                                <div>
                                                                    <div className="font-bold text-slate-800">{c.razonSocial}</div>
                                                                    <div className="text-[10px] text-slate-500 font-mono">RUC: {c.ruc}</div>
                                                                </div>
                                                                <span className="text-[10px] text-indigo-600 font-bold uppercase">Seleccionar</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-center text-xs text-slate-400">No se encontraron clientes</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between shadow-xs">
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">{selectedClient.razonSocial}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">RUC: {selectedClient.ruc}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setClienteId('')}
                                                className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold h-8"
                                            >
                                                Cambiar
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Método de Pago */}
                                <div className="space-y-1.5">
                                    <label htmlFor="methodPOS" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Método de Cobro
                                    </label>
                                    <Select 
                                        value={metodoPago} 
                                        onValueChange={setMetodoPago}
                                        disabled={isCheckingOut}
                                    >
                                        <SelectTrigger id="methodPOS" className="h-11 rounded-xl bg-slate-50/50 border-slate-200 w-full text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="efectivo" className="text-sm cursor-pointer">Efectivo</SelectItem>
                                            <SelectItem value="tarjeta" className="text-sm cursor-pointer">Tarjeta de Crédito / POS</SelectItem>
                                            <SelectItem value="yappy" className="text-sm cursor-pointer">Yappy / ACH</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Limits Info */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100/80">
                                <Zap className="h-3.5 w-3.5 text-indigo-500 fill-indigo-100" />
                                <span>Folios mensuales incluidos: {remainingDocuments} restantes.</span>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2 pt-2">
                                <Button
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut || remainingDocuments <= 0}
                                    className="w-full h-11 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs rounded-xl shadow-sm"
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Procesando Venta...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Cobrar y Timbrar Factura
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-11 rounded-xl font-bold text-xs"
                                    onClick={() => setShowCheckoutModal(false)}
                                    disabled={isCheckingOut}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success ticket sharing Modal */}
            {successInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setSuccessInvoice(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 mb-2">
                                    <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">¡Cobro Exitoso!</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    La transacción ha sido timbrada en la DGI y el saldo ha sido liquidado.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Factura No:</span>
                                    <span className="font-mono font-bold text-brand-1 dark:text-blue-400">{successInvoice.numeroCompleto}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Monto Recibido:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">{formatCurrency(successInvoice.totalNeto)}</span>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Entregar Comprobante
                                </label>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                                    >
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.062 5.248 5.308 0 11.777 0c3.137 0 6.085 1.22 8.302 3.439 2.219 2.219 3.438 5.168 3.436 8.307-.005 6.522-5.252 11.77-11.72 11.77-2.002-.001-3.97-.512-5.713-1.488L0 24zm6.59-4.859c1.72.1.085-.34 2.82.28 1.48.33 2.92.51 4.38.51 5.388 0 9.77-4.386 9.773-9.775.002-2.61-1.014-5.064-2.865-6.916C17.95 1.42 15.5 .4 12.89.4 7.502.4 3.12 4.78 3.117 10.165c-.002 1.63.39 3.22 1.13 4.64l.16.29-1.01 3.69 3.79-.99.3.18c1.35.8 2.9 1.22 4.47 1.22zM17.3 14.3c-.3-.15-1.78-.88-2.06-.98-.28-.1-.49-.15-.69.15-.2.3-.77.98-.95 1.18-.18.2-.36.23-.66.08-1.54-.77-2.58-1.34-3.56-3.03-.26-.45.26-.42.74-1.38.08-.16.04-.3-.02-.45-.06-.15-.49-1.18-.67-1.62-.18-.43-.37-.37-.5-.38l-.43-.01c-.15 0-.39.06-.6.28-.2.22-.8.78-.8 1.9s.82 2.2 1.05 2.5c.23.3 1.6 2.44 3.88 3.42.54.23 1 .37 1.34.48.55.17 1.05.15 1.44.09.44-.06 1.35-.55 1.54-1.08.19-.53.19-1 .13-1.08-.07-.08-.26-.13-.56-.28z"/>
                                        </svg>
                                        WhatsApp
                                    </a>
                                    <a
                                        href={emailUrl}
                                        className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                                    >
                                        <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        Correo
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="h-11 rounded-xl font-bold text-xs"
                                        onClick={() => {
                                            toast.info('Abriendo vista de impresión...');
                                            window.open(`/invoices/${successInvoice.id}/print`, '_blank');
                                        }}
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="h-11 rounded-xl font-bold text-xs"
                                        asChild
                                    >
                                        <Link href={`/invoices/${successInvoice.id}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Detalle
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
                                onClick={() => setSuccessInvoice(null)}
                            >
                                Nueva Venta
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ContentContainer>
    );
}
