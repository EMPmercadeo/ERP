'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Edit2 } from 'lucide-react';
import { updateBodega } from '@/lib/actions/bodegas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { SucursalOption } from './NewWarehouseModal';

export interface BodegaDetail {
    id: string;
    codigo: string;
    nombre: string;
    sucursalId: string;
    activa: boolean;
}

export function EditWarehouseModal({ bodega, sucursales }: { bodega: BodegaDetail; sucursales: SucursalOption[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sucursalId, setSucursalId] = useState(bodega.sucursalId);
    const [activa, setActiva] = useState(bodega.activa);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set('sucursalId', sucursalId);
        formData.set('activa', activa ? 'true' : 'false');

        try {
            const res = await updateBodega(bodega.id, null, formData);
            if (res && 'message' in res) {
                toast.error(res.message);
            } else {
                toast.success('Bodega actualizada exitosamente');
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                toast.success('Bodega actualizada exitosamente');
                setOpen(false);
                router.refresh();
                return;
            }
            toast.error('Error al actualizar la bodega');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Editar bodega" className="h-8 w-8 text-muted-foreground hover:text-brand-1">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Bodega</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de la bodega seleccionada.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div>
                        <Label htmlFor="sucursalId">Sucursal *</Label>
                        <Select value={sucursalId} onValueChange={setSucursalId}>
                            <SelectTrigger id="sucursalId">
                                <SelectValue placeholder="Seleccionar sucursal..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sucursales.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.codigo} - {s.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <Label htmlFor="codigo">Código *</Label>
                            <Input id="codigo" name="codigo" defaultValue={bodega.codigo} required placeholder="Ej. 001" maxLength={10} />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="nombre">Nombre de la Bodega *</Label>
                            <Input id="nombre" name="nombre" defaultValue={bodega.nombre} required placeholder="Ej. Bodega Central" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="activa">Estado *</Label>
                        <Select value={activa ? 'true' : 'false'} onValueChange={(val) => setActiva(val === 'true')}>
                            <SelectTrigger id="activa">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Activa</SelectItem>
                                <SelectItem value="false">Inactiva</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-brand-1 text-white hover:bg-brand-1/90" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
