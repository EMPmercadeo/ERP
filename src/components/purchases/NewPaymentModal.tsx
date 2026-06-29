'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';
import { createSupplierPayment } from '@/lib/actions/supplier-payments';
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export function NewPaymentModal({
    compraId,
    proveedorId,
    numeroFactura,
    proveedorNombre,
    saldoPendiente,
}: {
    compraId: string;
    proveedorId: string;
    numeroFactura: string;
    proveedorNombre: string;
    saldoPendiente: number;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [metodoPago, setMetodoPago] = useState('ACH');
    const [monto, setMonto] = useState(String(saldoPendiente));
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set('compraId', compraId);
        formData.set('proveedorId', proveedorId);
        formData.set('metodoPago', metodoPago);

        try {
            const res = await createSupplierPayment(null, formData);
            if (res && 'message' in res && res.message) {
                toast.error(res.message);
            } else {
                toast.success('Pago aplicado exitosamente');
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            if ((error as any)?.message?.includes('NEXT_REDIRECT')) {
                toast.success('Pago aplicado exitosamente');
                setOpen(false);
                router.refresh();
                return;
            }
            toast.error('Error al registrar el pago');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-8 text-xs">
                    <DollarSign className="mr-1 h-3.5 w-3.5" />
                    Pagar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Registrar Pago a Proveedor</DialogTitle>
                    <DialogDescription>
                        Aplicando abono o cancelación a la factura <span className="font-mono font-bold text-foreground">#{numeroFactura}</span> de <span className="font-semibold text-foreground">{proveedorNombre}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-medium">Saldo Pendiente:</span>
                        <span className="font-mono font-bold text-amber-600 text-base">{formatCurrency(saldoPendiente)}</span>
                    </div>

                    <div>
                        <Label htmlFor="monto">Monto a Pagar ($) *</Label>
                        <Input
                            id="monto"
                            name="monto"
                            type="number"
                            step="0.01"
                            max={saldoPendiente}
                            required
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="metodoPago">Método de Desembolso</Label>
                        <Select value={metodoPago} onValueChange={setMetodoPago}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACH">ACH / Transferencia Bancaria</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="Tarjeta">Tarjeta Débito / Crédito</SelectItem>
                                <SelectItem value="Efectivo">Efectivo / Caja Chica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="referencia">No. de Referencia / Cheque / ACH</Label>
                        <Input id="referencia" name="referencia" placeholder="Ej. ACH #998877 o Cheque #1024" />
                    </div>

                    <DialogFooter className="pt-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? 'Procesando...' : 'Aplicar Pago'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
