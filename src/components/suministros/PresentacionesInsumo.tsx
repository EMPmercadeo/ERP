'use client';

/**
 * Catálogo de suministro: en qué presentación vende un proveedor un insumo.
 *
 * El mismo componente sirve para las dos entradas naturales al dato, cambiando solo el
 * eje que queda fijo:
 *   modo="proveedor" -> pestaña Suministros de la ficha del proveedor ("qué me vende").
 *   modo="producto"  -> pestaña Receta de la ficha del producto ("dónde lo compro").
 *
 * El campo que más confusión causa es `unidadesPorPresentacion`, así que la interfaz lo
 * explica con el ejemplo del propio insumo y muestra en vivo el precio por unidad y a
 * cuántas unidades de producto terminado equivale una presentación.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import {
    getInsumosDeProveedor,
    getProveedoresDeInsumo,
    getInsumosDisponibles,
    getProveedoresActivos,
    guardarPresentacionProveedor,
    eliminarPresentacionProveedor,
    type PresentacionVista,
} from '@/lib/actions/proveedor-insumos';

interface OpcionProveedor {
    id: string;
    nombre: string;
}

interface OpcionInsumo {
    id: string;
    codigoInterno: string;
    descripcion: string;
    unidadMedida: string;
}

interface FormularioState {
    id: string | null;
    proveedorId: string;
    productoId: string;
    codigoProveedor: string;
    presentacion: string;
    unidadesPorPresentacion: string;
    precioPresentacion: string;
    diasEntrega: string;
    pedidoMinimo: string;
    esPreferido: boolean;
    activo: boolean;
    notas: string;
}

const FORM_VACIO: FormularioState = {
    id: null,
    proveedorId: '',
    productoId: '',
    codigoProveedor: '',
    presentacion: '',
    unidadesPorPresentacion: '',
    precioPresentacion: '',
    diasEntrega: '0',
    pedidoMinimo: '1',
    esPreferido: false,
    activo: true,
    notas: '',
};

function formatearNumero(n: number): string {
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString('es-PA');
    if (Number.isInteger(n)) return n.toString();
    return Number(n.toFixed(4)).toString();
}

export function PresentacionesInsumo({
    modo,
    proveedorId,
    productoId,
    unidadProducto,
    proveedoresDisponibles = [],
    soloLectura = false,
}: {
    modo: 'proveedor' | 'producto';
    /** Fijo cuando modo="proveedor". */
    proveedorId?: string;
    /** Fijo cuando modo="producto". */
    productoId?: string;
    /** Unidad base del insumo, para explicar la conversión. Solo en modo="producto". */
    unidadProducto?: string;
    /** Lista de proveedores para el selector. Solo hace falta en modo="producto". */
    proveedoresDisponibles?: OpcionProveedor[];
    soloLectura?: boolean;
}) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filas, setFilas] = useState<PresentacionVista[]>([]);
    const [insumos, setInsumos] = useState<OpcionInsumo[]>([]);
    const [proveedores, setProveedores] = useState<OpcionProveedor[]>(proveedoresDisponibles);
    const [form, setForm] = useState<FormularioState | null>(null);

    const recargar = async () => {
        const datos =
            modo === 'proveedor'
                ? await getInsumosDeProveedor(proveedorId!)
                : await getProveedoresDeInsumo(productoId!);
        setFilas(datos);
    };

    useEffect(() => {
        const cargar = async () => {
            const datos =
                modo === 'proveedor'
                    ? await getInsumosDeProveedor(proveedorId!)
                    : await getProveedoresDeInsumo(productoId!);
            setFilas(datos);

            // Cada modo necesita el catálogo del eje que NO está fijado: en la ficha del
            // proveedor se elige el insumo, y en la del producto se elige el proveedor.
            if (modo === 'proveedor') {
                setInsumos(await getInsumosDisponibles());
            } else if (proveedoresDisponibles.length === 0) {
                setProveedores(await getProveedoresActivos());
            }
            setLoading(false);
        };
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modo, proveedorId, productoId]);

    const abrirNuevo = () => {
        setForm({
            ...FORM_VACIO,
            proveedorId: proveedorId ?? '',
            productoId: productoId ?? '',
            // Si es el primer proveedor de este insumo, lo natural es que sea el preferido.
            esPreferido: modo === 'producto' && filas.length === 0,
        });
    };

    const abrirEdicion = (f: PresentacionVista) => {
        setForm({
            id: f.id,
            proveedorId: f.proveedorId,
            productoId: f.productoId,
            codigoProveedor: f.codigoProveedor ?? '',
            presentacion: f.presentacion,
            unidadesPorPresentacion: String(f.unidadesPorPresentacion),
            precioPresentacion: String(f.precioPresentacion),
            diasEntrega: String(f.diasEntrega),
            pedidoMinimo: String(f.pedidoMinimo),
            esPreferido: f.esPreferido,
            activo: f.activo,
            notas: f.notas ?? '',
        });
    };

    const guardar = async () => {
        if (!form) return;
        setSaving(true);
        try {
            const res = await guardarPresentacionProveedor(form.id, {
                proveedorId: form.proveedorId,
                productoId: form.productoId,
                codigoProveedor: form.codigoProveedor,
                presentacion: form.presentacion,
                unidadesPorPresentacion: Number(form.unidadesPorPresentacion),
                precioPresentacion: Number(form.precioPresentacion),
                diasEntrega: Number(form.diasEntrega),
                pedidoMinimo: Number(form.pedidoMinimo),
                esPreferido: form.esPreferido,
                activo: form.activo,
                notas: form.notas,
            });
            if (res.success) {
                toast.success('Presentación guardada.');
                setForm(null);
                await recargar();
            } else {
                toast.error(res.error ?? 'No se pudo guardar.');
            }
        } finally {
            setSaving(false);
        }
    };

    const eliminar = async (id: string) => {
        const res = await eliminarPresentacionProveedor(id);
        if (res.success) {
            toast.success('Presentación eliminada.');
            await recargar();
        } else {
            toast.error(res.error ?? 'No se pudo eliminar.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-1" />
            </div>
        );
    }

    const unidadesForm = Number(form?.unidadesPorPresentacion) || 0;
    const precioForm = Number(form?.precioPresentacion) || 0;
    const unidadInsumoForm =
        modo === 'producto'
            ? (unidadProducto ?? 'und')
            : (insumos.find((i) => i.id === form?.productoId)?.unidadMedida ?? 'und');

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-muted-foreground max-w-2xl">
                    {modo === 'proveedor'
                        ? 'Registra en qué presentación te vende este proveedor cada insumo y cuántas unidades trae. Con eso el ERP calcula solo cuánto pedir y cuánto va a costar.'
                        : 'Registra dónde comprar este insumo. La presentación preferida es la que se usa para sugerir la compra cuando el stock se acerca al punto de reorden.'}
                </p>
                {!soloLectura && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={abrirNuevo}
                        className="h-9 text-xs font-bold shrink-0"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Agregar presentación
                    </Button>
                )}
            </div>

            {form && (
                <div className="border border-border rounded-xl bg-card shadow-sm p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                            {form.id ? 'Editar presentación' : 'Nueva presentación'}
                        </h4>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setForm(null)}
                            className="h-7 w-7"
                            aria-label="Cerrar formulario"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {modo === 'proveedor' ? (
                            <div className="space-y-1">
                                <Label
                                    htmlFor="insumoSelect"
                                    className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                                >
                                    Insumo
                                </Label>
                                <Select
                                    value={form.productoId}
                                    onValueChange={(v) => setForm({ ...form, productoId: v })}
                                    disabled={!!form.id}
                                >
                                    <SelectTrigger id="insumoSelect" className="h-10 text-xs sm:text-sm">
                                        <SelectValue placeholder="Selecciona el insumo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg max-h-64">
                                        {insumos.map((i) => (
                                            <SelectItem key={i.id} value={i.id} className="text-xs cursor-pointer">
                                                {i.descripcion} ({i.codigoInterno})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <Label
                                    htmlFor="proveedorSelect"
                                    className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                                >
                                    Proveedor
                                </Label>
                                <Select
                                    value={form.proveedorId}
                                    onValueChange={(v) => setForm({ ...form, proveedorId: v })}
                                    disabled={!!form.id}
                                >
                                    <SelectTrigger id="proveedorSelect" className="h-10 text-xs sm:text-sm">
                                        <SelectValue placeholder="Selecciona el proveedor" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg max-h-64">
                                        {proveedores.map((p) => (
                                            <SelectItem key={p.id} value={p.id} className="text-xs cursor-pointer">
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label
                                htmlFor="presentacion"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Presentación
                            </Label>
                            <Input
                                id="presentacion"
                                value={form.presentacion}
                                onChange={(e) => setForm({ ...form, presentacion: e.target.value })}
                                placeholder="Saco 5 kg"
                                className="h-10 text-xs sm:text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="unidadesPorPresentacion"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Unidades que trae
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="unidadesPorPresentacion"
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={form.unidadesPorPresentacion}
                                    onChange={(e) => setForm({ ...form, unidadesPorPresentacion: e.target.value })}
                                    className="h-10 text-xs sm:text-sm"
                                />
                                <span className="text-xs text-muted-foreground font-medium shrink-0">
                                    {unidadInsumoForm.toLowerCase()}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground pt-0.5">
                                En la unidad con la que llevas el stock. Si la harina se cuenta en gramos, un saco de
                                5 kg son 5000.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="precioPresentacion"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Precio de la presentación
                            </Label>
                            <Input
                                id="precioPresentacion"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.precioPresentacion}
                                onChange={(e) => setForm({ ...form, precioPresentacion: e.target.value })}
                                className="h-10 text-xs sm:text-sm"
                            />
                            {unidadesForm > 0 && precioForm > 0 && (
                                <p className="text-[11px] text-muted-foreground pt-0.5">
                                    Sale a {formatCurrency(precioForm / unidadesForm)} por{' '}
                                    {unidadInsumoForm.toLowerCase()}.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="diasEntrega"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Días de entrega
                            </Label>
                            <Input
                                id="diasEntrega"
                                type="number"
                                min={0}
                                value={form.diasEntrega}
                                onChange={(e) => setForm({ ...form, diasEntrega: e.target.value })}
                                className="h-10 text-xs sm:text-sm"
                            />
                            <p className="text-[11px] text-muted-foreground pt-0.5">
                                Se usa para avisarte con tiempo: hay que pedir antes de que el stock baje de este
                                plazo.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="pedidoMinimo"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Pedido mínimo (presentaciones)
                            </Label>
                            <Input
                                id="pedidoMinimo"
                                type="number"
                                min={1}
                                value={form.pedidoMinimo}
                                onChange={(e) => setForm({ ...form, pedidoMinimo: e.target.value })}
                                className="h-10 text-xs sm:text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="codigoProveedor"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Código del proveedor (opcional)
                            </Label>
                            <Input
                                id="codigoProveedor"
                                value={form.codigoProveedor}
                                onChange={(e) => setForm({ ...form, codigoProveedor: e.target.value })}
                                placeholder="SKU con el que él lo identifica"
                                className="h-10 text-xs sm:text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="esPreferido"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                ¿Es tu opción por defecto?
                            </Label>
                            <Select
                                value={form.esPreferido ? 'true' : 'false'}
                                onValueChange={(v) => setForm({ ...form, esPreferido: v === 'true' })}
                            >
                                <SelectTrigger id="esPreferido" className="h-10 text-xs sm:text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="true" className="text-xs cursor-pointer">
                                        Sí, sugerir esta al reabastecer
                                    </SelectItem>
                                    <SelectItem value="false" className="text-xs cursor-pointer">
                                        No, es una alternativa
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={guardar}
                            disabled={saving}
                            className="h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs"
                        >
                            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            Guardar
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setForm(null)}
                            className="h-9 text-xs font-bold"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            <div className="border border-border rounded-xl overflow-x-auto bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>
                                {modo === 'proveedor' ? 'Insumo' : 'Proveedor'}
                            </TableHead>
                            <TableHead>
                                Presentación
                            </TableHead>
                            <TableHead className="text-right">
                                Precio
                            </TableHead>
                            <TableHead className="text-right">
                                Por unidad
                            </TableHead>
                            <TableHead className="text-center">
                                Entrega
                            </TableHead>
                            <TableHead>
                                Rinde
                            </TableHead>
                            {!soloLectura && <TableHead className="w-20"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filas.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={soloLectura ? 6 : 7}
                                    className="h-20 text-center text-muted-foreground text-xs font-semibold"
                                >
                                    {modo === 'proveedor'
                                        ? 'Este proveedor todavía no tiene insumos registrados.'
                                        : 'Todavía no registraste dónde comprar este insumo.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filas.map((f) => (
                                <TableRow
                                    key={f.id}
                                    className={cn('border-b border-border last:border-0', !f.activo && 'opacity-50')}
                                >
                                    <TableCell className="py-2 text-xs font-medium text-foreground">
                                        <div className="flex items-center gap-1.5">
                                            {f.esPreferido && (
                                                <Star
                                                    className="h-3.5 w-3.5 text-warning shrink-0"
                                                    aria-label="Proveedor preferido"
                                                />
                                            )}
                                            {modo === 'proveedor' ? f.descripcion : f.proveedorNombre}
                                        </div>
                                        {modo === 'proveedor' && f.codigoProveedor && (
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                SKU: {f.codigoProveedor}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 text-xs text-foreground">
                                        <div>{f.presentacion}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">
                                            {formatearNumero(f.unidadesPorPresentacion)} {f.unidadMedida.toLowerCase()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 text-xs text-right font-mono font-bold text-foreground">
                                        {formatCurrency(f.precioPresentacion)}
                                    </TableCell>
                                    <TableCell className="py-2 text-xs text-right font-mono text-muted-foreground">
                                        {formatCurrency(f.precioPorUnidad)}
                                    </TableCell>
                                    <TableCell className="py-2 text-xs text-center text-muted-foreground">
                                        {f.diasEntrega === 0 ? 'Inmediata' : `${f.diasEntrega} d`}
                                    </TableCell>
                                    <TableCell className="py-2 text-xs">
                                        {f.rendimientos.length === 0 ? (
                                            <span className="text-muted-foreground">—</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {f.rendimientos.slice(0, 3).map((r) => (
                                                    <Badge
                                                        key={r.productoId}
                                                        variant="neutral"
                                                        className="text-[10px] font-semibold"
                                                    >
                                                        {formatearNumero(r.unidades)} {r.descripcion}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                    {!soloLectura && (
                                        <TableCell className="py-2 text-right whitespace-nowrap">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => abrirEdicion(f)}
                                                className="h-7 w-7 text-muted-foreground hover:text-brand-1"
                                                aria-label={`Editar presentación ${f.presentacion}`}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => eliminar(f.id)}
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                aria-label={`Eliminar presentación ${f.presentacion}`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {filas.length > 0 && filas.every((f) => !f.esPreferido) && (
                <Alert variant="warning" className="text-xs font-semibold">
                    <span>
                        Ninguna presentación está marcada como preferida. Marca una para que el ERP sepa cuál sugerir
                        al reabastecer.
                    </span>
                </Alert>
            )}
        </div>
    );
}

export default PresentacionesInsumo;
