'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { createTransferencia, getProductosDisponiblesEnBodega } from '@/lib/actions/transferencias';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface BodegaOption {
    id: string;
    codigo: string;
    nombre: string;
}

interface ProductoDisponible {
    productoId: string;
    codigo: string;
    descripcion: string;
    disponible: number;
}

interface TransferItem {
    productoId: string;
    descripcion: string;
    disponible: number;
    cantidad: number;
}

export function NewTransferModal({ bodegas }: { bodegas: BodegaOption[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bodegaOrigenId, setBodegaOrigenId] = useState('');
    const [bodegaDestinoId, setBodegaDestinoId] = useState('');
    const [notas, setNotas] = useState('');
    const [productosOrigen, setProductosOrigen] = useState<ProductoDisponible[]>([]);
    const [items, setItems] = useState<TransferItem[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!open) return;
        setBodegaOrigenId('');
        setBodegaDestinoId('');
        setNotas('');
        setItems([]);
        setProductosOrigen([]);
        setProductoSeleccionado('');
    }, [open]);

    useEffect(() => {
        if (!bodegaOrigenId) {
            setProductosOrigen([]);
            return;
        }
        setItems([]);
        getProductosDisponiblesEnBodega(bodegaOrigenId).then(setProductosOrigen);
    }, [bodegaOrigenId]);

    const bodegasDestinoDisponibles = useMemo(
        () => bodegas.filter((b) => b.id !== bodegaOrigenId),
        [bodegas, bodegaOrigenId]
    );

    const productosDisponiblesParaAgregar = useMemo(
        () => productosOrigen.filter((p) => !items.some((i) => i.productoId === p.productoId)),
        [productosOrigen, items]
    );

    const addItem = () => {
        const prod = productosOrigen.find((p) => p.productoId === productoSeleccionado);
        if (!prod) return;
        setItems([...items, { productoId: prod.productoId, descripcion: prod.descripcion, disponible: prod.disponible, cantidad: 1 }]);
        setProductoSeleccionado('');
    };

    const updateCantidad = (productoId: string, cantidad: number) => {
        setItems(items.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)));
    };

    const removeItem = (productoId: string) => {
        setItems(items.filter((i) => i.productoId !== productoId));
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!bodegaOrigenId || !bodegaDestinoId) {
            toast.error('Selecciona la bodega de origen y destino.');
            return;
        }
        if (items.length === 0) {
            toast.error('Agrega al menos un producto a transferir.');
            return;
        }
        for (const item of items) {
            if (item.cantidad <= 0 || item.cantidad > item.disponible) {
                toast.error(`Cantidad inválida para "${item.descripcion}". Disponible: ${item.disponible}.`);
                return;
            }
        }

        setLoading(true);
        const formData = new FormData();
        formData.set('bodegaOrigenId', bodegaOrigenId);
        formData.set('bodegaDestinoId', bodegaDestinoId);
        formData.set('notas', notas);
        formData.set('items', JSON.stringify(items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }))));

        try {
            const res = await createTransferencia(null, formData);
            if (res?.success) {
                toast.success(res.message);
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res?.message || 'Error al crear la transferencia.');
            }
        } catch {
            toast.error('Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-1 text-white hover:bg-brand-1/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transferencia
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nueva Transferencia entre Bodegas</DialogTitle>
                    <DialogDescription>
                        El stock se descuenta de la bodega de origen al crear la transferencia y queda &quot;en tránsito&quot; hasta que se confirme su recepción en destino.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                        <div>
                            <Label htmlFor="bodegaOrigenId">Bodega de Origen *</Label>
                            <Select value={bodegaOrigenId} onValueChange={setBodegaOrigenId}>
                                <SelectTrigger id="bodegaOrigenId">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {bodegas.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.codigo} - {b.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground mb-2.5" />
                        <div>
                            <Label htmlFor="bodegaDestinoId">Bodega de Destino *</Label>
                            <Select value={bodegaDestinoId} onValueChange={setBodegaDestinoId} disabled={!bodegaOrigenId}>
                                <SelectTrigger id="bodegaDestinoId">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {bodegasDestinoDisponibles.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.codigo} - {b.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {bodegaOrigenId && (
                        <div className="space-y-2">
                            <Label>Productos a Transferir</Label>
                            <div className="flex gap-2">
                                <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={productosDisponiblesParaAgregar.length === 0 ? 'Sin stock disponible en esta bodega' : 'Seleccionar producto...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {productosDisponiblesParaAgregar.map((p) => (
                                            <SelectItem key={p.productoId} value={p.productoId}>
                                                {p.codigo} - {p.descripcion} (disp: {p.disponible})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" onClick={addItem} disabled={!productoSeleccionado}>
                                    Agregar
                                </Button>
                            </div>

                            {items.length > 0 && (
                                <div className="border rounded-lg divide-y">
                                    {items.map((item) => (
                                        <div key={item.productoId} className="flex items-center justify-between gap-2 p-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-foreground truncate">{item.descripcion}</p>
                                                <p className="text-xs text-muted-foreground">Disponible: {item.disponible}</p>
                                            </div>
                                            <Input
                                                type="number"
                                                min="1"
                                                max={item.disponible}
                                                step="1"
                                                value={item.cantidad}
                                                onChange={(e) => updateCantidad(item.productoId, parseInt(e.target.value) || 0)}
                                                className="w-20"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(item.productoId)}
                                                aria-label="Quitar producto"
                                                className="text-destructive hover:text-destructive shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="notas">Notas (opcional)</Label>
                        <Textarea
                            id="notas"
                            name="notas"
                            placeholder="Motivo del traslado, transportista, etc."
                            rows={2}
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-brand-1 text-white hover:bg-brand-1/90" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Transferencia'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
