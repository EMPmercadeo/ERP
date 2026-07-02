'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Trash, ArrowLeft, Save, FileText } from 'lucide-react';
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
    quotes: Array<{
        id: string;
        numero: string;
        clienteId: string;
        items: Array<{
            productoId: string | null;
            descripcion: string;
            cantidad: number;
            precioUnitario: number;
            codigoTasaItbms: string;
            descuento: number;
        }>;
    }>;
    users: Array<{ id: string; nombre: string }>;
    companyId: string;
}

interface FormItem {
    productoId: string | null;
    descripcion: string;
    cantidadPedida: number;
    cantidadEntregada: number;
    cantidadPendiente: number;
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

export function DeliveryNoteForm({ clients, products, quotes, users }: FormProps) {
    const router = useRouter();
    const [clienteId, setClienteId] = useState('');
    const [cotizacionId, setCotizacionId] = useState('');
    const [direccionEntrega, setDireccionEntrega] = useState('');
    const [nombreContacto, setNombreContacto] = useState('');
    const [telefonoContacto, setTelefonoContacto] = useState('');
    const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState('');
    const [notasInternas, setNotasInternas] = useState('');
    const [notasCliente, setNotasCliente] = useState('');
    const [responsableId, setResponsableId] = useState('');
    const [estado, setEstado] = useState('pendiente'); // borrador | pendiente
    const [items, setItems] = useState<FormItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Selected product state for add item form
    const [selProductId, setSelProductId] = useState('');
    const [selQty, setSelQty] = useState('1');

    // Totals calculation
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalDescuento = 0;
        let totalItbms = 0;

        items.forEach(item => {
            // Totals based on quantity ordered
            const base = item.cantidadPedida * item.precioUnitario;
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

    // Handle quote selection & autofill
    const handleQuoteChange = (quoteId: string) => {
        setCotizacionId(quoteId);
        const quote = quotes.find(q => q.id === quoteId);
        if (quote) {
            setClienteId(quote.clienteId);
            
            // Auto fill items
            const newItems: FormItem[] = quote.items.map(item => ({
                productoId: item.productoId,
                descripcion: item.descripcion,
                cantidadPedida: item.cantidad,
                cantidadEntregada: item.cantidad, // default to complete delivery
                cantidadPendiente: 0,
                precioUnitario: item.precioUnitario,
                descuento: item.descuento,
                codigoTasaItbms: item.codigoTasaItbms
            }));
            setItems(newItems);
            toast.success(`Datos cargados desde Cotización ${quote.numero}`);
        }
    };

    const handleAddProduct = () => {
        const prod = products.find(p => p.id === selProductId);
        if (!prod) return;

        const qty = parseFloat(selQty) || 1;

        // Check if product already exists in items
        const existingIdx = items.findIndex(i => i.productoId === prod.id);
        if (existingIdx !== -1) {
            const updated = [...items];
            updated[existingIdx].cantidadPedida += qty;
            updated[existingIdx].cantidadEntregada += qty;
            updated[existingIdx].cantidadPendiente = Math.max(0, updated[existingIdx].cantidadPedida - updated[existingIdx].cantidadEntregada);
            setItems(updated);
        } else {
            setItems([...items, {
                productoId: prod.id,
                descripcion: prod.descripcion,
                cantidadPedida: qty,
                cantidadEntregada: qty,
                cantidadPendiente: 0,
                precioUnitario: prod.precio,
                descuento: 0,
                codigoTasaItbms: prod.itbms
            }]);
        }

        // Reset add item form
        setSelProductId('');
        setSelQty('1');
    };

    const handleItemQtyChange = (index: number, field: 'cantidadPedida' | 'cantidadEntregada', value: string) => {
        const val = parseFloat(value) || 0;
        const updated = [...items];
        updated[index][field] = val;
        updated[index].cantidadPendiente = Math.max(0, updated[index].cantidadPedida - updated[index].cantidadEntregada);
        setItems(updated);
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

        // Validation: delivery quantities shouldn't exceed ordered quantities
        const invalidItem = items.find(item => item.cantidadEntregada > item.cantidadPedida);
        if (invalidItem) {
            toast.error(`La cantidad entregada de "${invalidItem.descripcion}" no puede superar la cantidad solicitada.`);
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('clienteId', clienteId);
        formData.append('cotizacionId', cotizacionId);
        formData.append('direccionEntrega', direccionEntrega);
        formData.append('nombreContacto', nombreContacto);
        formData.append('telefonoContacto', telefonoContacto);
        formData.append('fechaEstimadaEntrega', fechaEstimadaEntrega);
        formData.append('notasInternas', notasInternas);
        formData.append('notasCliente', notasCliente);
        formData.append('responsableId', responsableId);
        formData.append('estado', estado);
        formData.append('items', JSON.stringify(items));

        try {
            const res = await createDeliveryNote(null, formData);
            if (res && res.success) {
                toast.success(res.message);
                router.push('/delivery-notes');
                router.refresh();
            } else {
                toast.error(res?.message || 'Error al guardar el documento de entrega.');
            }
        } catch (error) {
            toast.error('Error de red al guardar el documento de entrega.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ContentContainer className="py-4 space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/delivery-notes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver a Notas de Entrega
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Client selection & Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cabecera del Documento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="cotizacionId">Cargar desde Cotización (Opcional)</Label>
                                    <Select value={cotizacionId} onValueChange={handleQuoteChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona cotización..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Ninguna</SelectItem>
                                            {quotes.map(q => (
                                                <SelectItem key={q.id} value={q.id}>
                                                    Cotización #{q.numero}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="clienteId">Cliente *</Label>
                                    <Select value={clienteId} onValueChange={setClienteId} disabled={!!cotizacionId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un cliente..." />
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                                <div>
                                    <Label htmlFor="direccionEntrega">Dirección de Entrega</Label>
                                    <Input 
                                        id="direccionEntrega" 
                                        placeholder="Calle, Local, Edificio" 
                                        value={direccionEntrega} 
                                        onChange={(e) => setDireccionEntrega(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nombreContacto">Persona de Contacto</Label>
                                    <Input 
                                        id="nombreContacto" 
                                        placeholder="Nombre del receptor" 
                                        value={nombreContacto} 
                                        onChange={(e) => setNombreContacto(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="telefonoContacto">Teléfono de Contacto</Label>
                                    <Input 
                                        id="telefonoContacto" 
                                        placeholder="Ej. +507 6655-4433" 
                                        value={telefonoContacto} 
                                        onChange={(e) => setTelefonoContacto(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <Label htmlFor="fechaEstimadaEntrega">Fecha Estimada de Entrega</Label>
                                    <Input 
                                        id="fechaEstimadaEntrega" 
                                        type="date" 
                                        value={fechaEstimadaEntrega} 
                                        onChange={(e) => setFechaEstimadaEntrega(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="responsableId">Responsable de la Entrega</Label>
                                    <Select value={responsableId} onValueChange={setResponsableId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Asigna un responsable..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add Item Form Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos o Servicios a Entregar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                <div className="sm:col-span-2">
                                    <Label>Agregar Producto del Catálogo</Label>
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
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right w-32">Cant. Solicitada</TableHead>
                                            <TableHead className="text-right w-32">Cant. Entregada</TableHead>
                                            <TableHead className="text-right w-24">Pendiente</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                            <TableHead className="w-12 text-center"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length > 0 ? items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                <TableCell className="text-right">
                                                    <Input 
                                                        type="number" 
                                                        min="0.0001" 
                                                        step="any"
                                                        value={item.cantidadPedida} 
                                                        onChange={(e) => handleItemQtyChange(idx, 'cantidadPedida', e.target.value)}
                                                        className="w-24 text-right ml-auto h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input 
                                                        type="number" 
                                                        min="0" 
                                                        step="any"
                                                        value={item.cantidadEntregada} 
                                                        onChange={(e) => handleItemQtyChange(idx, 'cantidadEntregada', e.target.value)}
                                                        className="w-24 text-right ml-auto h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-amber-600">
                                                    {item.cantidadPendiente}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(item.cantidadPedida * item.precioUnitario)}
                                                </TableCell>
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
                                                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                                    Ningún producto o servicio agregado.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Notes, Status & Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Observaciones y Notas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="notasCliente">Notas para el Cliente (Visibles)</Label>
                                <Textarea 
                                    id="notasCliente" 
                                    placeholder="Mensaje de agradecimiento, términos de entrega..." 
                                    value={notasCliente} 
                                    onChange={(e) => setNotasCliente(e.target.value)} 
                                />
                            </div>
                            <div>
                                <Label htmlFor="notasInternas">Notas Internas (Ocultas)</Label>
                                <Textarea 
                                    id="notasInternas" 
                                    placeholder="Detalles confidenciales, instrucciones internas..." 
                                    value={notasInternas} 
                                    onChange={(e) => setNotasInternas(e.target.value)} 
                                />
                            </div>
                            <div>
                                <Label htmlFor="estado">Estado Inicial</Label>
                                <Select value={estado} onValueChange={setEstado}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="borrador">Borrador</SelectItem>
                                        <SelectItem value="pendiente">Pendiente (Aprobado)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen Estimado</CardTitle>
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
                                {loading ? 'Guardando...' : 'Crear Nota de Entrega'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </ContentContainer>
    );
}
