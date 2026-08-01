'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createPurchase } from '@/lib/actions/purchases';
import { convertirPresentacionAUnidades } from '@/lib/services/reabastecimientoCore';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface SupplierSimple {
    id: string;
    razonSocial: string;
    ruc: string;
}

interface ProductSimple {
    id: string;
    descripcion: string;
    costoUnitario: number;
    unidadMedida?: string;
}

/**
 * Presentación en la que un proveedor vende un producto ("Paquete 100 und", "Saco 5 kg").
 * `unidadesPorPresentacion` es el puente entre cómo se compra y cómo se lleva el stock.
 */
interface PresentacionSimple {
    id: string;
    proveedorId: string;
    productoId: string;
    presentacion: string;
    unidadesPorPresentacion: number;
    precioPresentacion: number;
    esPreferido: boolean;
}

interface BodegaSimple {
    id: string;
    codigo: string;
    nombre: string;
}

interface ItemRow {
    productoId: string;
    descripcion: string;
    /** SIEMPRE en la unidad base del producto. Si se compró por presentación, ya viene convertida. */
    cantidad: number;
    /** SIEMPRE por unidad base, nunca por presentación. */
    costoUnitario: number;
    descuento: number;
    codigoTasaItbms: string;
    /** Presentación elegida. Vacío = se está capturando directo en unidades. */
    presentacionId: string;
    /** Cuántas presentaciones se compraron (2 paquetes). Solo se usa si hay presentacionId. */
    cantidadPresentaciones: number;
}

const ITEM_VACIO: ItemRow = {
    productoId: '',
    descripcion: '',
    cantidad: 1,
    costoUnitario: 0,
    descuento: 0,
    codigoTasaItbms: '01',
    presentacionId: '',
    cantidadPresentaciones: 1,
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function NewPurchaseForm({
    suppliers,
    products,
    bodegas = [],
    presentaciones = [],
}: {
    suppliers: SupplierSimple[];
    products: ProductSimple[];
    bodegas?: BodegaSimple[];
    presentaciones?: PresentacionSimple[];
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [proveedorId, setProveedorId] = useState('');
    const [numeroFactura, setNumeroFactura] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [fechaVencimiento, setFechaVencimiento] = useState(
        () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [observaciones, setObservaciones] = useState('');
    const [bodegaId, setBodegaId] = useState(bodegas[0]?.id || '');

    const [items, setItems] = useState<ItemRow[]>([{ ...ITEM_VACIO }]);

    /** Presentaciones que este proveedor vende de este producto. */
    const presentacionesDe = (productoId: string) =>
        presentaciones.filter((p) => p.productoId === productoId && p.proveedorId === proveedorId);

    /**
     * Aplica una presentación a una fila: la cantidad pasa a contarse en presentaciones y
     * el sistema traduce a unidades base. Comprar "2 × Paquete 100" guarda 200 unidades con
     * el costo por unidad correcto, que es justo lo que el inventario necesita para cuadrar.
     */
    const aplicarPresentacion = (fila: ItemRow, presentacionId: string, cantidadPresentaciones: number): ItemRow => {
        const pres = presentaciones.find((p) => p.id === presentacionId);
        const convertido = pres ? convertirPresentacionAUnidades(cantidadPresentaciones, pres) : null;

        if (!pres) return { ...fila, presentacionId: '', cantidadPresentaciones };
        // Cantidad inválida (0 o vacía mientras se escribe): se conserva la presentación
        // elegida y solo se deja de convertir, para no borrarle la selección al usuario.
        if (!convertido) return { ...fila, presentacionId, cantidadPresentaciones };

        return {
            ...fila,
            presentacionId,
            cantidadPresentaciones,
            cantidad: convertido.cantidadBase,
            costoUnitario: convertido.costoPorUnidadBase,
        };
    };

    const handleProductSelect = (index: number, prodId: string) => {
        const prod = products.find(p => p.id === prodId);
        const newItems = [...items];
        let fila: ItemRow = {
            ...newItems[index],
            productoId: prodId,
            descripcion: prod ? prod.descripcion : newItems[index].descripcion,
            costoUnitario: prod ? prod.costoUnitario : newItems[index].costoUnitario,
            presentacionId: '',
        };

        // Si este proveedor tiene una presentación preferida para el producto, se propone
        // sola: es la forma en que realmente se compra, y evita el error de escribir "2"
        // cuando en realidad entraron 200 unidades.
        const disponibles = presentaciones.filter((p) => p.productoId === prodId && p.proveedorId === proveedorId);
        const sugerida = disponibles.find((p) => p.esPreferido) ?? disponibles[0];
        if (sugerida) {
            fila = aplicarPresentacion(fila, sugerida.id, fila.cantidadPresentaciones || 1);
        }

        newItems[index] = fila;
        setItems(newItems);
    };

    const handlePresentacionSelect = (index: number, presentacionId: string) => {
        const newItems = [...items];
        newItems[index] = presentacionId
            ? aplicarPresentacion(newItems[index], presentacionId, newItems[index].cantidadPresentaciones || 1)
            : { ...newItems[index], presentacionId: '' };
        setItems(newItems);
    };

    const handleCantidadPresentaciones = (index: number, cantidadPresentaciones: number) => {
        const newItems = [...items];
        newItems[index] = aplicarPresentacion(
            newItems[index],
            newItems[index].presentacionId,
            cantidadPresentaciones
        );
        setItems(newItems);
    };

    /**
     * Al cambiar de proveedor hay que soltar las presentaciones elegidas: pertenecen al
     * proveedor anterior y dejarlas puestas mostraría un precio que este no ofrece.
     * La cantidad en unidades ya capturada se respeta, solo se deja de contar en paquetes.
     */
    const handleProveedorChange = (nuevoProveedorId: string) => {
        setProveedorId(nuevoProveedorId);
        setItems((prev) =>
            prev.map((fila) => {
                const actual = presentaciones.find((p) => p.id === fila.presentacionId);
                if (actual && actual.proveedorId === nuevoProveedorId) return fila;

                // La fila queda sin presentación válida. Si el nuevo proveedor vende ese
                // producto en alguna presentación, se propone la preferida: es el caso común
                // de elegir el producto antes que el proveedor, y sin esto la fila se quedaría
                // en unidades sueltas sin que nadie lo note.
                const limpia = { ...fila, presentacionId: '' };
                if (!fila.productoId) return limpia;

                const disponibles = presentaciones.filter(
                    (p) => p.productoId === fila.productoId && p.proveedorId === nuevoProveedorId
                );
                const sugerida = disponibles.find((p) => p.esPreferido) ?? disponibles[0];
                return sugerida
                    ? aplicarPresentacion(limpia, sugerida.id, limpia.cantidadPresentaciones || 1)
                    : limpia;
            })
        );
    };

    const handleItemChange = (index: number, field: keyof ItemRow, value: ItemRow[keyof ItemRow]) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { ...ITEM_VACIO }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    // Calculate totals
    let subtotal = 0;
    let totalDescuento = 0;
    let totalItbms = 0;

    items.forEach(item => {
        const imp = item.cantidad * item.costoUnitario;
        const desc = item.descuento || 0;
        const base = imp - desc;
        const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                     item.codigoTasaItbms === '02' ? 0.10 :
                     item.codigoTasaItbms === '03' ? 0.15 : 0;
        subtotal += imp;
        totalDescuento += desc;
        totalItbms += base * tasa;
    });

    const totalNeto = subtotal - totalDescuento + totalItbms;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!proveedorId) {
            toast.error('Selecciona un proveedor');
            return;
        }
        if (!numeroFactura.trim()) {
            toast.error('Ingresa el número de factura del proveedor');
            return;
        }
        if (items.some(i => !i.descripcion.trim())) {
            toast.error('Todos los ítems deben tener una descripción');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.set('proveedorId', proveedorId);
        formData.set('numeroFactura', numeroFactura);
        formData.set('fechaEmision', fechaEmision);
        formData.set('fechaVencimiento', fechaVencimiento);
        if (observaciones) formData.set('observaciones', observaciones);
        if (bodegas.length >= 2 && bodegaId) formData.set('bodegaId', bodegaId);
        // `cantidadPresentaciones` es solo ayuda de captura: al servidor viaja la cantidad
        // ya convertida a unidades base, que es la única que el inventario entiende.
        formData.set(
            'items',
            JSON.stringify(
                items.map(({ cantidadPresentaciones: _paquetes, ...resto }) => ({
                    ...resto,
                    presentacionId: resto.presentacionId || null,
                }))
            )
        );

        try {
            const res = await createPurchase(null, formData);
            if (res && 'message' in res && res.message) {
                toast.error(res.message);
            } else {
                toast.success('Factura de compra registrada exitosamente');
                router.push('/purchases');
                router.refresh();
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                toast.success('Factura de compra registrada exitosamente');
                router.push('/purchases');
                router.refresh();
                return;
            }
            toast.error('Error al registrar la compra');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ContentContainer className="py-6 max-w-5xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild aria-label="Volver a compras">
                    <Link href="/purchases">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ingresar Factura de Proveedor</h2>
                    <p className="text-sm text-muted-foreground">Registra compras de inventario y gastos en cuentas por pagar</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Datos del Documento</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="proveedor">Proveedor *</Label>
                            <Select value={proveedorId} onValueChange={handleProveedorChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proveedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.razonSocial} ({s.ruc})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="numeroFactura">No. Factura / Recibo *</Label>
                            <Input
                                id="numeroFactura"
                                required
                                placeholder="Ej. A-10293"
                                value={numeroFactura}
                                onChange={(e) => setNumeroFactura(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="fechaEmision">Fecha Emisión *</Label>
                            <Input
                                id="fechaEmision"
                                type="date"
                                required
                                value={fechaEmision}
                                onChange={(e) => setFechaEmision(e.target.value)}
                            />
                        </div>

                        <div className="md:col-start-3">
                            <Label htmlFor="fechaVencimiento">Fecha Vencimiento *</Label>
                            <Input
                                id="fechaVencimiento"
                                type="date"
                                required
                                value={fechaVencimiento}
                                onChange={(e) => setFechaVencimiento(e.target.value)}
                            />
                        </div>

                        {bodegas.length >= 2 && (
                            <div>
                                <Label htmlFor="bodega">Bodega de Entrada *</Label>
                                <Select value={bodegaId} onValueChange={setBodegaId}>
                                    <SelectTrigger id="bodega">
                                        <SelectValue placeholder="Seleccionar bodega..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bodegas.map(b => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.codigo} - {b.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Detalle de Productos o Gastos</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={addItem}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
                        </Button>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Producto (Opcional)</TableHead>
                                    <TableHead className="min-w-[180px]">Descripción / Gasto</TableHead>
                                    <TableHead className="w-[170px]">Presentación</TableHead>
                                    <TableHead className="w-[110px]">Cant.</TableHead>
                                    <TableHead className="w-[120px]">Costo Unit.</TableHead>
                                    <TableHead className="w-[100px]">Desc.</TableHead>
                                    <TableHead className="w-[110px]">ITBMS</TableHead>
                                    <TableHead className="w-[120px] text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => {
                                    const opcionesPresentacion = presentacionesDe(item.productoId);
                                    const presentacionElegida = presentaciones.find((p) => p.id === item.presentacionId);
                                    const unidadBase =
                                        products.find((p) => p.id === item.productoId)?.unidadMedida || 'UND';
                                    const imp = item.cantidad * item.costoUnitario;
                                    const base = imp - (item.descuento || 0);
                                    const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                                                 item.codigoTasaItbms === '02' ? 0.10 :
                                                 item.codigoTasaItbms === '03' ? 0.15 : 0;
                                    const totalItem = base * (1 + tasa);

                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Select
                                                    value={item.productoId || 'none'}
                                                    onValueChange={(val) => handleProductSelect(index, val === 'none' ? '' : val)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue placeholder="Gasto manual..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-- Gasto / Servicio --</SelectItem>
                                                        {products.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.descripcion}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    required
                                                    className="h-9 text-xs"
                                                    placeholder="Descripción del ítem o servicio"
                                                    value={item.descripcion}
                                                    onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {opcionesPresentacion.length > 0 ? (
                                                    <Select
                                                        value={item.presentacionId || 'unidad'}
                                                        onValueChange={(val) =>
                                                            handlePresentacionSelect(index, val === 'unidad' ? '' : val)
                                                        }
                                                    >
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="unidad">
                                                                Por {unidadBase.toLowerCase()} (suelto)
                                                            </SelectItem>
                                                            {opcionesPresentacion.map((op) => (
                                                                <SelectItem key={op.id} value={op.id}>
                                                                    {op.presentacion} ({op.unidadesPorPresentacion}{' '}
                                                                    {unidadBase.toLowerCase()})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {item.productoId
                                                            ? `Por ${unidadBase.toLowerCase()}`
                                                            : '—'}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {presentacionElegida ? (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            step="1"
                                                            min="1"
                                                            required
                                                            className="h-9 text-xs"
                                                            aria-label="Cantidad de presentaciones"
                                                            value={item.cantidadPresentaciones}
                                                            onChange={(e) =>
                                                                handleCantidadPresentaciones(
                                                                    index,
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                        />
                                                        {/* El número que de verdad entra al inventario, a la vista
                                                            para que nadie tenga que confiar a ciegas en la conversión. */}
                                                        <span className="block text-[10px] text-muted-foreground font-mono pt-0.5">
                                                            = {item.cantidad.toLocaleString('es-PA')}{' '}
                                                            {unidadBase.toLowerCase()}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        required
                                                        className="h-9 text-xs"
                                                        value={item.cantidad}
                                                        onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                    className="h-9 text-xs"
                                                    value={item.costoUnitario}
                                                    onChange={(e) => handleItemChange(index, 'costoUnitario', parseFloat(e.target.value) || 0)}
                                                />
                                                {presentacionElegida && (
                                                    <span className="block text-[10px] text-muted-foreground font-mono pt-0.5">
                                                        {formatCurrency(item.costoUnitario * presentacionElegida.unidadesPorPresentacion)} / {presentacionElegida.presentacion}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="h-9 text-xs"
                                                    value={item.descuento}
                                                    onChange={(e) => handleItemChange(index, 'descuento', parseFloat(e.target.value) || 0)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={item.codigoTasaItbms}
                                                    onValueChange={(val) => handleItemChange(index, 'codigoTasaItbms', val)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="00">Exento (0%)</SelectItem>
                                                        <SelectItem value="01">7%</SelectItem>
                                                        <SelectItem value="02">10%</SelectItem>
                                                        <SelectItem value="03">15%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs font-bold">
                                                {formatCurrency(totalItem)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label="Eliminar ítem"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Observaciones / Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                placeholder="Notas internas sobre esta factura..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/80">
                        <CardContent className="pt-6 space-y-3 font-mono text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {totalDescuento > 0 && (
                                <div className="flex justify-between text-danger">
                                    <span>Descuento:</span>
                                    <span>-{formatCurrency(totalDescuento)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total ITBMS:</span>
                                <span>{formatCurrency(totalItbms)}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between font-bold text-lg text-foreground">
                                <span>Total por Pagar:</span>
                                <span className="text-brand-1">{formatCurrency(totalNeto)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push('/purchases')}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-brand-1 text-white hover:bg-brand-1/90 px-8">
                        {loading ? 'Guardando...' : 'Registrar Compra'}
                    </Button>
                </div>
            </form>
        </ContentContainer>
    );
}
