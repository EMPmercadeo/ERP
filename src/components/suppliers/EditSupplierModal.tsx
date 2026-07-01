'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Loader2 } from 'lucide-react';
import { SupplierData } from './SupplierList';
import { updateSupplierInline } from '@/lib/actions/suppliers';

interface EditSupplierModalProps {
    supplier: SupplierData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updated: SupplierData) => void;
}

export function EditSupplierModal({
    supplier,
    open,
    onOpenChange,
    onSuccess,
}: EditSupplierModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        razonSocial: supplier.razonSocial || '',
        nombreComercial: supplier.nombreComercial || '',
        ruc: supplier.ruc || '',
        dv: supplier.dv || '',
        nombreContacto: supplier.nombreContacto || '',
        email: supplier.email || '',
        telefono: supplier.telefono || '',
        condicionPago: supplier.condicionPago || 'Contado',
        limiteCredito: supplier.limiteCredito ? supplier.limiteCredito.toString() : '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await updateSupplierInline(supplier.id, {
                razonSocial: formData.razonSocial,
                nombreComercial: formData.nombreComercial,
                ruc: formData.ruc,
                dv: formData.dv,
                nombreContacto: formData.nombreContacto,
                email: formData.email,
                telefono: formData.telefono,
                condicionPago: formData.condicionPago,
                limiteCredito: formData.limiteCredito ? Number(formData.limiteCredito) : 0,
            });

            if (res.success && res.data) {
                toast.success('Proveedor actualizado correctamente');
                onSuccess({
                    ...supplier,
                    ...res.data
                });
                onOpenChange(false);
            } else {
                toast.error(res.error || 'Error al actualizar el proveedor');
            }
        } catch (error) {
            toast.error('Error inesperado al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Edit className="h-5 w-5 text-indigo-600" />
                        Editar Proveedor
                    </DialogTitle>
                    <DialogDescription>
                        Modifica los datos comerciales y crediticios del proveedor.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Razón Social *</label>
                            <Input
                                required
                                value={formData.razonSocial}
                                onChange={e => handleChange('razonSocial', e.target.value)}
                                placeholder="Ej. Cable & Wireless Panamá S.A."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Nombre Comercial</label>
                            <Input
                                value={formData.nombreComercial}
                                onChange={e => handleChange('nombreComercial', e.target.value)}
                                placeholder="Ej. +Móvil"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">RUC *</label>
                            <Input
                                required
                                value={formData.ruc}
                                onChange={e => handleChange('ruc', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Dígito Verificador (DV)</label>
                            <Input
                                value={formData.dv}
                                onChange={e => handleChange('dv', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Nombre de Contacto</label>
                            <Input
                                value={formData.nombreContacto}
                                onChange={e => handleChange('nombreContacto', e.target.value)}
                                placeholder="Nombre del representante"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                                placeholder="ventas@proveedor.com.pa"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Teléfono</label>
                            <Input
                                value={formData.telefono}
                                onChange={e => handleChange('telefono', e.target.value)}
                                placeholder="260-0000 / 6000-0000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Condición de Pago</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={formData.condicionPago}
                                onChange={e => handleChange('condicionPago', e.target.value)}
                            >
                                <option value="Contado">Contado</option>
                                <option value="Crédito 15 días">Crédito 15 días</option>
                                <option value="Crédito 30 días">Crédito 30 días</option>
                                <option value="Crédito 60 días">Crédito 60 días</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Límite de Crédito (USD)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.limiteCredito}
                                onChange={e => handleChange('limiteCredito', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
