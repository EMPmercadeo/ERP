'use client';

/**
 * Pestaña "Receta" de la ficha de producto.
 *
 * Deja declarar de qué está hecho un producto elaborado usando el lenguaje del negocio:
 * "con 5000 g de harina me salen 50 bolas". A partir de eso el ERP calcula solo el
 * consumo por unidad, cuántas unidades quedan con el stock actual, el costo real y el
 * margen -- y descuenta los insumos cada vez que se vende.
 *
 * Todo lo que se ve en el panel de la derecha se recalcula en vivo mientras se edita,
 * antes de guardar, para que nadie tenga que guardar a ciegas para ver el efecto.
 */

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Info, Loader2, Plus, Save, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import {
    getRecetaDeProducto,
    getProductosParaReceta,
    guardarReceta,
    eliminarReceta,
} from '@/lib/actions/recetas';

interface InsumoFila {
    insumoId: string;
    descripcion: string;
    codigoInterno: string;
    unidadMedida: string;
    cantidad: number;
    merma: number;
    opcional: boolean;
    stockActual: number;
    costoUnitario: number;
}

interface ProductoCandidato {
    id: string;
    codigoInterno: string;
    descripcion: string;
    unidadMedida: string;
    stockActual: number;
    costoUnitario: number;
    esInsumo: boolean;
}

function formatearNumero(n: number): string {
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString('es-PA');
    if (Number.isInteger(n)) return n.toString();
    return Number(n.toFixed(3)).toString();
}

export function RecetaTab({
    productoId,
    unidadProducto,
    precioVenta,
}: {
    productoId: string;
    unidadProducto: string;
    precioVenta: number;
}) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tieneReceta, setTieneReceta] = useState(false);
    const [existiaReceta, setExistiaReceta] = useState(false);

    const [rendimiento, setRendimiento] = useState(1);
    const [descuentaAutomatico, setDescuentaAutomatico] = useState(true);
    const [notas, setNotas] = useState('');
    const [insumos, setInsumos] = useState<InsumoFila[]>([]);

    const [candidatos, setCandidatos] = useState<ProductoCandidato[]>([]);
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        Promise.all([getRecetaDeProducto(productoId), getProductosParaReceta(productoId)])
            .then(([receta, productos]) => {
                if (receta) {
                    setTieneReceta(receta.activo);
                    setExistiaReceta(true);
                    setRendimiento(receta.rendimiento);
                    setDescuentaAutomatico(receta.descuentaAutomatico);
                    setNotas(receta.notas ?? '');
                    setInsumos(
                        receta.insumos.map((i) => ({
                            insumoId: i.insumoId,
                            descripcion: i.descripcion,
                            codigoInterno: i.codigoInterno,
                            unidadMedida: i.unidadMedida,
                            cantidad: i.cantidad,
                            merma: i.merma,
                            opcional: i.opcional,
                            stockActual: i.stockActual,
                            costoUnitario: i.costoUnitario,
                        }))
                    );
                }
                setCandidatos(productos);
            })
            .finally(() => setLoading(false));
    }, [productoId]);

    // Proyección en vivo. Es una aproximación de primer nivel: si un insumo es a su vez
    // elaborado, el cálculo definitivo (que baja por todas las recetas intermedias) lo
    // hace el servidor al guardar. Sirve para ver el efecto de lo que se está escribiendo.
    const proyeccion = useMemo(() => {
        const lote = rendimiento > 0 ? rendimiento : 1;
        const filas = insumos.map((i) => {
            const porUnidad = (i.cantidad * (1 + i.merma / 100)) / lote;
            return {
                ...i,
                consumoPorUnidad: porUnidad,
                unidadesQuePermite: porUnidad > 0 ? Math.floor(i.stockActual / porUnidad) : 0,
                costoPorUnidad: porUnidad * i.costoUnitario,
            };
        });

        const obligatorias = filas.filter((f) => !f.opcional);
        const unidadesPosibles = obligatorias.length
            ? Math.min(...obligatorias.map((f) => f.unidadesQuePermite))
            : null;
        const cuello = obligatorias.length
            ? obligatorias.reduce((min, f) => (f.unidadesQuePermite < min.unidadesQuePermite ? f : min))
            : null;
        const costoPorUnidad = filas.reduce((sum, f) => sum + f.costoPorUnidad, 0);

        return {
            filas,
            unidadesPosibles,
            cuello,
            costoPorUnidad,
            margen: precioVenta > 0 ? ((precioVenta - costoPorUnidad) / precioVenta) * 100 : null,
        };
    }, [insumos, rendimiento, precioVenta]);

    const candidatosFiltrados = candidatos.filter(
        (p) =>
            !insumos.some((i) => i.insumoId === p.id) &&
            (!search ||
                p.descripcion.toLowerCase().includes(search.toLowerCase()) ||
                p.codigoInterno.toLowerCase().includes(search.toLowerCase()))
    );

    const agregarInsumo = (p: ProductoCandidato) => {
        setInsumos((prev) => [
            ...prev,
            {
                insumoId: p.id,
                descripcion: p.descripcion,
                codigoInterno: p.codigoInterno,
                unidadMedida: p.unidadMedida,
                cantidad: 1,
                merma: 0,
                opcional: false,
                stockActual: p.stockActual,
                costoUnitario: p.costoUnitario,
            },
        ]);
        setSearch('');
        setShowSearch(false);
    };

    const actualizar = (insumoId: string, cambios: Partial<InsumoFila>) => {
        setInsumos((prev) => prev.map((i) => (i.insumoId === insumoId ? { ...i, ...cambios } : i)));
    };

    const quitar = (insumoId: string) => {
        setInsumos((prev) => prev.filter((i) => i.insumoId !== insumoId));
    };

    const handleGuardar = async () => {
        setSaving(true);
        try {
            if (!tieneReceta) {
                if (!existiaReceta) return;
                const res = await eliminarReceta(productoId);
                if (res.success) {
                    toast.success('Receta eliminada. Este producto vuelve a manejar su propio stock.');
                    setExistiaReceta(false);
                    setInsumos([]);
                } else {
                    toast.error(res.error ?? 'No se pudo eliminar la receta.');
                }
                return;
            }

            if (insumos.length === 0) {
                toast.error('Agrega al menos un insumo antes de guardar.');
                return;
            }

            const res = await guardarReceta(productoId, {
                rendimiento,
                descuentaAutomatico,
                activo: true,
                notas,
                insumos: insumos.map((i) => ({
                    insumoId: i.insumoId,
                    cantidad: i.cantidad,
                    merma: i.merma,
                    opcional: i.opcional,
                })),
            });

            if (res.success) {
                toast.success('Receta guardada. El ERP ya descuenta estos insumos en cada venta.');
                setExistiaReceta(true);
            } else {
                toast.error(res.error ?? 'No se pudo guardar la receta.');
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
                <Label
                    htmlFor="tieneRecetaToggle"
                    className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                >
                    ¿Este producto se fabrica con insumos?
                </Label>
                <Select value={tieneReceta ? 'true' : 'false'} onValueChange={(v) => setTieneReceta(v === 'true')}>
                    <SelectTrigger
                        id="tieneRecetaToggle"
                        className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg w-full sm:w-2/3"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                        <SelectItem value="false" className="text-xs sm:text-sm cursor-pointer">
                            No, se compra y se vende tal cual
                        </SelectItem>
                        <SelectItem value="true" className="text-xs sm:text-sm cursor-pointer">
                            Sí, se prepara consumiendo otros productos
                        </SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                    Una receta transforma insumos (harina → masa → pizza). Un kit, en cambio, agrupa productos que
                    también se venden por separado. Un producto no puede ser las dos cosas.
                </p>
            </div>

            {tieneReceta && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label
                                htmlFor="rendimiento"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Un lote rinde
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="rendimiento"
                                    type="number"
                                    min={0.001}
                                    step="any"
                                    value={rendimiento}
                                    onChange={(e) => setRendimiento(Number(e.target.value) || 0)}
                                    className="h-10 text-xs sm:text-sm w-32"
                                />
                                <span className="text-xs text-muted-foreground font-medium">
                                    {unidadProducto.toLowerCase()}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground pt-0.5">
                                Declara los insumos por lote completo, como los mide el negocio. Si con un saco de
                                5000 g de harina salen 50 bolas, el rendimiento es 50.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="descuentaAutomatico"
                                className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                            >
                                Manejo del inventario
                            </Label>
                            <Select
                                value={descuentaAutomatico ? 'true' : 'false'}
                                onValueChange={(v) => setDescuentaAutomatico(v === 'true')}
                            >
                                <SelectTrigger
                                    id="descuentaAutomatico"
                                    className="h-10 text-xs sm:text-sm bg-muted/50 border-border rounded-lg"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="true" className="text-xs sm:text-sm cursor-pointer">
                                        Descontar los insumos al vender
                                    </SelectItem>
                                    <SelectItem value="false" className="text-xs sm:text-sm cursor-pointer">
                                        Llevar stock propio (producción por lotes)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground pt-0.5">
                                {descuentaAutomatico
                                    ? 'Este producto no lleva stock propio: cuánto hay se calcula desde los insumos. Así nunca hay dos números peleándose por lo mismo.'
                                    : 'Este producto lleva su propio stock y lo cuentas tú. La receta solo se usa para proyectar y avisar.'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Insumos que consume un lote
                        </Label>

                        {showSearch ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar insumo..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8 h-10 text-xs sm:text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div className="border border-border rounded-lg max-h-48 overflow-auto bg-card shadow-sm">
                                    {candidatosFiltrados.length > 0 ? (
                                        candidatosFiltrados.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => agregarInsumo(p)}
                                                className="w-full px-3 py-2 text-left hover:bg-accent flex justify-between items-center border-b last:border-0 border-border"
                                            >
                                                <span className="text-xs font-medium text-foreground">
                                                    {p.descripcion}{' '}
                                                    <span className="text-muted-foreground font-mono">
                                                        ({p.codigoInterno})
                                                    </span>
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {formatearNumero(p.stockActual)} {p.unidadMedida.toLowerCase()}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-3 text-xs text-muted-foreground text-center">
                                            No hay más productos disponibles para usar como insumo.
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowSearch(false);
                                        setSearch('');
                                    }}
                                    className="h-8 text-xs"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSearch(true)}
                                className="h-9 text-xs font-bold"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Agregar Insumo
                            </Button>
                        )}
                    </div>

                    <div className="border border-border rounded-xl overflow-x-auto bg-card shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase">
                                        Insumo
                                    </TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-center w-28">
                                        Por lote
                                    </TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-center w-24">
                                        Merma %
                                    </TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-right">
                                        Por unidad
                                    </TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-right">
                                        Alcanza para
                                    </TableHead>
                                    <TableHead className="h-9 text-foreground font-bold text-[10px] uppercase text-center w-24">
                                        Opcional
                                    </TableHead>
                                    <TableHead className="h-9 w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proyeccion.filas.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-20 text-center text-muted-foreground text-xs font-semibold"
                                        >
                                            Aún no has agregado insumos a esta receta.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    proyeccion.filas.map((f) => (
                                        <TableRow key={f.insumoId} className="border-b border-border last:border-0">
                                            <TableCell className="py-2 text-xs font-medium text-foreground">
                                                <div>{f.descripcion}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                    stock: {formatearNumero(f.stockActual)} {f.unidadMedida.toLowerCase()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <div className="flex items-center gap-1 justify-center">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="any"
                                                        value={f.cantidad}
                                                        onChange={(e) =>
                                                            actualizar(f.insumoId, {
                                                                cantidad: Number(e.target.value) || 0,
                                                            })
                                                        }
                                                        className="h-8 text-xs text-center w-20"
                                                        aria-label={`Cantidad por lote de ${f.descripcion}`}
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {f.unidadMedida.toLowerCase()}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={99}
                                                    step="any"
                                                    value={f.merma}
                                                    onChange={(e) =>
                                                        actualizar(f.insumoId, { merma: Number(e.target.value) || 0 })
                                                    }
                                                    className="h-8 text-xs text-center w-16 mx-auto"
                                                    aria-label={`Merma de ${f.descripcion}`}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 text-xs text-right font-mono text-muted-foreground">
                                                {formatearNumero(f.consumoPorUnidad)} {f.unidadMedida.toLowerCase()}
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'py-2 text-xs text-right font-mono font-bold',
                                                    proyeccion.cuello?.insumoId === f.insumoId
                                                        ? 'text-destructive'
                                                        : 'text-foreground'
                                                )}
                                            >
                                                {formatearNumero(f.unidadesQuePermite)}
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={f.opcional}
                                                    onChange={(e) =>
                                                        actualizar(f.insumoId, { opcional: e.target.checked })
                                                    }
                                                    className="h-4 w-4 accent-brand-1 cursor-pointer"
                                                    aria-label={`${f.descripcion} es opcional`}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => quitar(f.insumoId)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    aria-label={`Quitar insumo ${f.descripcion}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-muted rounded-xl p-3 border border-border">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Puedes producir ahora
                            </div>
                            <div className="text-lg font-bold text-brand-1 font-mono">
                                {proyeccion.unidadesPosibles === null
                                    ? '—'
                                    : `${formatearNumero(proyeccion.unidadesPosibles)} ${unidadProducto.toLowerCase()}`}
                            </div>
                            {proyeccion.cuello && (
                                <div className="text-[10px] text-muted-foreground pt-0.5">
                                    Se acaba primero: {proyeccion.cuello.descripcion}
                                </div>
                            )}
                        </div>
                        <div className="bg-muted rounded-xl p-3 border border-border">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Costo por unidad
                            </div>
                            <div className="text-lg font-bold text-foreground font-mono">
                                {formatCurrency(proyeccion.costoPorUnidad)}
                            </div>
                            <div className="text-[10px] text-muted-foreground pt-0.5">
                                Suma del costo de los insumos, con merma incluida.
                            </div>
                        </div>
                        <div className="bg-muted rounded-xl p-3 border border-border">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Margen sobre el precio
                            </div>
                            <div
                                className={cn(
                                    'text-lg font-bold font-mono',
                                    proyeccion.margen !== null && proyeccion.margen < 0
                                        ? 'text-destructive'
                                        : 'text-foreground'
                                )}
                            >
                                {proyeccion.margen === null ? '—' : `${proyeccion.margen.toFixed(1)}%`}
                            </div>
                            <div className="text-[10px] text-muted-foreground pt-0.5">
                                Precio de venta: {formatCurrency(precioVenta)}
                            </div>
                        </div>
                    </div>

                    {proyeccion.margen !== null && proyeccion.margen < 0 && (
                        <Alert variant="error" className="text-xs font-semibold">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                                Los insumos cuestan más que el precio de venta. Cada unidad vendida da pérdida.
                            </span>
                        </Alert>
                    )}

                    {descuentaAutomatico && (
                        <Alert className="text-xs font-semibold">
                            <Info className="h-4 w-4" />
                            <span>
                                Con esta opción, al facturar o vender en el POS se descuentan los insumos y no el
                                stock de este producto. El movimiento queda en el historial de inventario como
                                &quot;consumo_receta&quot;.
                            </span>
                        </Alert>
                    )}

                    <div className="space-y-1">
                        <Label
                            htmlFor="notasReceta"
                            className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block"
                        >
                            Notas de preparación (opcional)
                        </Label>
                        <Textarea
                            id="notasReceta"
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="Tiempo de amasado, temperatura del horno, quién la prepara..."
                            className="text-xs sm:text-sm"
                        />
                    </div>
                </>
            )}

            {!tieneReceta && existiaReceta && (
                <Alert variant="error" className="text-xs font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                        Al guardar se eliminará la receta. Este producto volverá a manejar su propio stock y dejarán
                        de descontarse sus insumos al vender.
                    </span>
                </Alert>
            )}

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    onClick={handleGuardar}
                    disabled={saving || (!tieneReceta && !existiaReceta)}
                    className="h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-1.5" />
                    )}
                    Guardar Receta
                </Button>
                {existiaReceta && tieneReceta && (
                    <Badge variant="secondary" className="text-[10px] font-bold">
                        Receta activa
                    </Badge>
                )}
            </div>
        </div>
    );
}

export default RecetaTab;
