'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { createClientQuick } from '@/lib/actions/clients';
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

export interface QuickClient {
    id: string;
    razonSocial: string;
    ruc: string;
    dv?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
}

/**
 * Alta rápida de cliente en línea (sin salir de la pantalla actual, p.ej. nueva cotización).
 * Usa la misma acción/validación que el módulo de Clientes, así que el cliente queda guardado
 * de verdad y se refleja en Clientes y donde corresponda. Al crearse, se entrega vía `onCreated`
 * para seleccionarlo de inmediato.
 */
export function NewClientModal({ onCreated }: { onCreated: (cliente: QuickClient) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tipoRuc, setTipoRuc] = useState('02');
    const [diasCredito, setDiasCredito] = useState('0');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        try {
            const res = await createClientQuick({
                tipoRuc,
                ruc: String(formData.get('ruc') || ''),
                dv: String(formData.get('dv') || ''),
                razonSocial: String(formData.get('razonSocial') || ''),
                email: String(formData.get('email') || ''),
                telefono: String(formData.get('telefono') || ''),
                direccion: String(formData.get('direccion') || ''),
                limiteCredito: String(formData.get('limiteCredito') || ''),
                diasCredito,
                descuentoEspecial: String(formData.get('descuentoEspecial') || ''),
            });

            if (!res.success) {
                toast.error(res.message);
                return;
            }

            toast.success('Cliente creado y guardado en Clientes.');
            setOpen(false);
            onCreated({
                id: res.cliente.id,
                razonSocial: res.cliente.razonSocial,
                ruc: res.cliente.ruc,
                dv: res.cliente.dv ?? undefined,
                email: res.cliente.email ?? undefined,
                telefono: res.cliente.telefono ?? undefined,
                direccion: res.cliente.direccion ?? undefined,
            });
        } catch (error) {
            console.error('NewClientModal error:', error);
            toast.error('Error al crear el cliente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-8">
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Nuevo cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar nuevo cliente</DialogTitle>
                    <DialogDescription>
                        Se guarda en tu módulo de Clientes y queda seleccionado en esta cotización.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor="qc-tipoRuc">Tipo</Label>
                            <Select value={tipoRuc} onValueChange={setTipoRuc}>
                                <SelectTrigger id="qc-tipoRuc">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="01">01 - Persona Natural</SelectItem>
                                    <SelectItem value="02">02 - Persona Jurídica</SelectItem>
                                    <SelectItem value="03">03 - Gobierno</SelectItem>
                                    <SelectItem value="04">04 - Extranjero</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="qc-ruc">RUC / Identificación *</Label>
                            <Input id="qc-ruc" name="ruc" required placeholder="Ej. 15569874-1-2023" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor="qc-dv">DV</Label>
                            <Input id="qc-dv" name="dv" placeholder="Ej. 85" maxLength={2} />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="qc-razonSocial">Razón Social *</Label>
                            <Input id="qc-razonSocial" name="razonSocial" required placeholder="Nombre legal o de la persona" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="qc-email">Correo Electrónico</Label>
                            <Input id="qc-email" name="email" type="email" placeholder="cliente@correo.com" />
                        </div>
                        <div>
                            <Label htmlFor="qc-telefono">Teléfono</Label>
                            <Input id="qc-telefono" name="telefono" placeholder="Ej. 6000-1234" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="qc-direccion">Dirección</Label>
                        <Input id="qc-direccion" name="direccion" placeholder="Ciudad, Calle, Local..." />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor="qc-limiteCredito">Límite Crédito (USD)</Label>
                            <Input id="qc-limiteCredito" name="limiteCredito" type="number" min="0" step="0.01" placeholder="0.00" />
                        </div>
                        <div>
                            <Label htmlFor="qc-diasCredito">Días Crédito</Label>
                            <Select value={diasCredito} onValueChange={setDiasCredito}>
                                <SelectTrigger id="qc-diasCredito">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Contado</SelectItem>
                                    <SelectItem value="15">15 días</SelectItem>
                                    <SelectItem value="30">30 días</SelectItem>
                                    <SelectItem value="45">45 días</SelectItem>
                                    <SelectItem value="60">60 días</SelectItem>
                                    <SelectItem value="90">90 días</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="qc-descuentoEspecial">Descuento (%)</Label>
                            <Input id="qc-descuentoEspecial" name="descuentoEspecial" type="number" min="0" max="100" step="0.01" placeholder="0" />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar cliente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
