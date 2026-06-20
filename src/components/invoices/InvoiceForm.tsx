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
    Package
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
import { useState, useMemo } from 'react';

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

export function InvoiceForm({ clients, products }: { clients: ClientOption[], products: ProductOption[] }) {
    const router = useRouter();
    const [state, formAction] = useFormState(createInvoice, initialState);

    // Form state
    const [clienteId, setClienteId] = useState('');
    const [condicionPago, setCondicionPago] = useState('contado');
    const [observaciones, setObservaciones] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);

    // Product search
    const [productSearch, setProductSearch] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return products; // Show all if no search
        return products.filter(p =>
            p.descripcion.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.codigo.toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [productSearch, products]);

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
                                <CardContent>
                                    <Select value={clienteId} onValueChange={setClienteId}>
                                        <SelectTrigger className={state?.errors?.clienteId ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Seleccionar cliente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.length > 0 ? clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    <div>
                                                        <span className="font-medium">{client.razonSocial}</span>
                                                        <span className="text-muted-foreground ml-2 text-xs">{client.ruc}</span>
                                                    </div>
                                                </SelectItem>
                                            )) : (
                                                <SelectItem value="none" disabled>No hay clientes registrados</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {state?.errors?.clienteId && <p className="text-xs text-destructive mt-1">{state.errors.clienteId[0]}</p>}

                                    {selectedClient && (
                                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                            <p className="font-medium">{selectedClient.razonSocial}</p>
                                            <p className="text-sm text-muted-foreground">RUC: {selectedClient.ruc}</p>
                                        </div>
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
                                <SubmitButton disabled={items.length === 0} />
                                <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
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
