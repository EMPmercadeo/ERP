'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Trash, ArrowLeft, Save } from 'lucide-react';
import { createDeliveryNote } from '@/lib/actions/delivery-notes';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FormProps {
    clients: Array<{ id: string; razonSocial: string; ruc: string }>;
    products: Array<{ id: string; codigo: string; descripcion: string; precio: number; itbms: string }>;
    companyId: string;
}

interface FormItem {
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    codigoTasaItbms: string;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function DeliveryNoteForm({ clients, products }: FormProps) {
    const router = useRouter();
    const [clienteId, setClienteId] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [items, setItems] = useState<FormItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Selected product state for add item form
    const [selProductId, setSelProductId] = useState('');
    const [selQty, setSelQty] = useState('1');
    const [selDiscount, setSelDiscount] = useState('0');

    // Totals calculation
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalDescuento = 0;
        let totalItbms = 0;

        items.forEach(item => {
            const base = item.cantidad * item.precioUnitario;
            const desc = item.descuento;
            const baseImponible = base - desc;
            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                         item.codigoTasaItbms === '02' ? 0.10 :
                         item.codigoTasaItbms === '03' ? 0.15 : 0;
            const itbms = baseImponible * tasa;

            subtotal += base;
            totalDescuento += desc;
            totalItbms += itbms;
        });

        return {
            subtotal,
            totalDescuento,
            totalItbms,
            totalNeto: subtotal - totalDescuento + totalItbms
        };
    }, [items]);

    function useMemo<T>(factory: () => T, deps: any[]): T {
        // Simple client-side useMemo mock or just use React's useMemo
        return React_useMemo(factory, deps);
    }
    
    function React_useMemo<T>(factory: () => T, deps: any[]): T {
        const [state, setState] = useState<T>(factory);
        const [prevDeps, setPrevDeps] = useState(deps);
        const changed = deps.some((dep, i) => dep !== prevDeps[i]);
        if (changed) {
            const next = factory();
            setState(next);
            setPrevDeps(deps);
            return next;
        }
        return state;
    }

    const handleAddProduct = () => {
        const prod = products.find(p => p.id === selProductId);
        if (!prod) return;

        const qty = parseFloat(selQty) || 1;
        const desc = parseFloat(selDiscount) || 0;

        // Check if product already exists in items
        const existingIdx = items.findIndex(i => i.productoId === prod.id);
        if (existingIdx > 0 || existingIdx === 0) {
            const updated = [...items];
            updated[existingIdx].cantidad += qty;
            updated[existingIdx].descuento += desc;
            setItems(updated);
        } else {
            setItems([...items, {
                productoId: prod.id,
                descripcion: prod.descripcion,
                cantidad: qty,
                precioUnitario: prod.precio,
                descuento: desc,
                codigoTasaItbms: prod.itbms
            }]);
        }

        // Reset add item form
        setSelProductId('');
        setSelQty('1');
        setSelDiscount('0');
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!clienteId) {
            toast.error('Selecciona un cliente.');
            return;
        }
        if (items.length === 0) {
            toast.error('Agrega al menos un producto.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('clienteId', clienteId);
        formData.append('observaciones', observaciones);
        formData.append('items', JSON.stringify(items));

        try {
            const res = await createDeliveryNote(null, formData);
            if (res && res.success) {
                toast.success(res.message);
                router.push('/delivery-notes');
                router.refresh();
            } else {
                toast.error(res?.message || 'Error al guardar el albarán.');
            }
        } catch (error) {
            toast.error('Error de red al guardar el albarán.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ContentContainer className="py-4 space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/delivery-notes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver a Albaranes
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Client selection & Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos del Albarán</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="clienteId">Cliente *</Label>
                                <Select value={clienteId} onValueChange={setClienteId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un cliente para la entrega..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.razonSocial} (RUC: {c.ruc})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="observaciones">Observaciones de Entrega</Label>
                                <Textarea 
                                    id="observaciones" 
                                    placeholder="Indique detalles de envío, dirección exacta de entrega, transportista, etc." 
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add Item form card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos a Entregar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                <div className="sm:col-span-2">
                                    <Label>Producto / Servicio</Label>
                                    <Select value={selProductId} onValueChange={setSelProductId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un producto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.codigo} - {p.descripcion} ({formatCurrency(p.precio)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Cantidad</Label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={selQty} 
                                        onChange={(e) => setSelQty(e.target.value)} 
                                    />
                                </div>
                                <Button 
                                    type="button" 
                                    onClick={handleAddProduct} 
                                    disabled={!selProductId}
                                    className="bg-brand-1 text-white hover:bg-brand-1/90"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Agregar
                                </Button>
                            </div>

                            {/* Items table */}
                            <div className="rounded-md border overflow-hidden mt-4">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="w-12 text-center"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                <TableCell className="text-right">{item.cantidad}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.cantidad * item.precioUnitario)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-red-500 hover:text-red-700 h-8 w-8"
                                                        onClick={() => handleRemoveItem(idx)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                    Ningún producto agregado al albarán.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Summary & Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen del Albarán</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Descuento:</span>
                                    <span>-{formatCurrency(totals.totalDescuento)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">ITBMS:</span>
                                    <span className="font-semibold">{formatCurrency(totals.totalItbms)}</span>
                                </div>
                                <hr />
                                <div className="flex justify-between text-base font-bold text-slate-800">
                                    <span>Total Estimado:</span>
                                    <span className="text-brand-1">{formatCurrency(totals.totalNeto)}</span>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading || items.length === 0} 
                                className="w-full bg-brand-1 text-white hover:bg-brand-1/90 gap-2"
                            >
                                <Save className="h-4.5 w-4.5" />
                                {loading ? 'Creando...' : 'Crear Albarán'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </ContentContainer>
    );
}
