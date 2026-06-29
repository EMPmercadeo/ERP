'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { createSupplier } from '@/lib/actions/suppliers';
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

export function NewSupplierModal({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tipoRuc, setTipoRuc] = useState('J');
    const [condicionPago, setCondicionPago] = useState('Contado');
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set('tipoRuc', tipoRuc);
        formData.set('condicionPago', condicionPago);

        try {
            const res = await createSupplier(null, formData);
            if (res && 'message' in res && res.errors) {
                toast.error(res.message);
            } else if (res && 'message' in res && !res.errors) {
                toast.error(res.message);
            } else {
                toast.success('Proveedor creado exitosamente');
                setOpen(false);
                router.refresh();
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            // Next.js redirect throws an error that we shouldn't catch as a failure if it's NEXT_REDIRECT
            if ((error as any)?.message?.includes('NEXT_REDIRECT')) {
                toast.success('Proveedor creado exitosamente');
                setOpen(false);
                router.refresh();
                if (onSuccess) onSuccess();
                return;
            }
            toast.error('Error al crear el proveedor');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-1 text-white hover:bg-brand-1/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Proveedor</DialogTitle>
                    <DialogDescription>
                        Ingresa los datos fiscales y de contacto del proveedor para cuentas por pagar.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor="tipoRuc">Tipo</Label>
                            <Select value={tipoRuc} onValueChange={setTipoRuc}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="J">Jurídico (J)</SelectItem>
                                    <SelectItem value="N">Natural (N)</SelectItem>
                                    <SelectItem value="E">Extranjero (E)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="ruc">RUC / Identificación *</Label>
                            <Input id="ruc" name="ruc" required placeholder="Ej. 15569874-1-2023" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor="dv">DV</Label>
                            <Input id="dv" name="dv" placeholder="Ej. 85" maxLength={2} />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="razonSocial">Razón Social *</Label>
                            <Input id="razonSocial" name="razonSocial" required placeholder="Nombre legal de la empresa o persona" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="nombreComercial">Nombre Comercial (Opcional)</Label>
                        <Input id="nombreComercial" name="nombreComercial" placeholder="Nombre de marca o tienda" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" name="email" type="email" placeholder="contabilidad@proveedor.com" />
                        </div>
                        <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input id="telefono" name="telefono" placeholder="Ej. 300-1234" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input id="direccion" name="direccion" placeholder="Ciudad, Calle, Local..." />
                    </div>

                    <div>
                        <Label htmlFor="condicionPago">Términos de Pago por Defecto</Label>
                        <Select value={condicionPago} onValueChange={setCondicionPago}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Contado">Contado</SelectItem>
                                <SelectItem value="Crédito 15 días">Crédito 15 días</SelectItem>
                                <SelectItem value="Crédito 30 días">Crédito 30 días</SelectItem>
                                <SelectItem value="Crédito 60 días">Crédito 60 días</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Proveedor'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
