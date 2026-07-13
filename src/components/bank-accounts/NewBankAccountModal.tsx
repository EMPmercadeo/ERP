'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { createBankAccount } from '@/lib/actions/bank-accounts';
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

export interface CuentaContableOption {
    id: string;
    codigo: string;
    nombre: string;
}

export function NewBankAccountModal({ cuentasContables }: { cuentasContables: CuentaContableOption[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tipoCuenta, setTipoCuenta] = useState('CORRIENTE');
    const [cuentaContableId, setCuentaContableId] = useState(cuentasContables[0]?.id || '');
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set('tipoCuenta', tipoCuenta);
        formData.set('cuentaContableId', cuentaContableId);

        try {
            const res = await createBankAccount(null, formData);
            if (res && 'message' in res) {
                toast.error(res.message);
            } else {
                toast.success('Cuenta bancaria creada exitosamente');
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                toast.success('Cuenta bancaria creada exitosamente');
                setOpen(false);
                router.refresh();
                return;
            }
            toast.error('Error al crear la cuenta bancaria');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-1 text-white hover:bg-brand-1/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cuenta Bancaria
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Cuenta Bancaria</DialogTitle>
                    <DialogDescription>
                        Vincula la cuenta bancaria a su cuenta contable de efectivo/bancos correspondiente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div>
                        <Label htmlFor="nombre">Nombre de la Cuenta *</Label>
                        <Input id="nombre" name="nombre" required placeholder="Ej. Cuenta Operativa BGeneral" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="banco">Banco *</Label>
                            <Input id="banco" name="banco" required placeholder="Ej. Banco General" />
                        </div>
                        <div>
                            <Label htmlFor="numeroCuenta">Número de Cuenta *</Label>
                            <Input id="numeroCuenta" name="numeroCuenta" required placeholder="Ej. 04-01-01-123456-7" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="tipoCuenta">Tipo de Cuenta</Label>
                            <Select value={tipoCuenta} onValueChange={setTipoCuenta}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CORRIENTE">Corriente</SelectItem>
                                    <SelectItem value="AHORRO">Ahorro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="saldoInicial">Saldo Inicial ($)</Label>
                            <Input id="saldoInicial" name="saldoInicial" type="number" step="0.01" placeholder="0.00" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="cuentaContableId">Cuenta Contable Vinculada *</Label>
                        <Select value={cuentaContableId} onValueChange={setCuentaContableId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una cuenta de bancos" />
                            </SelectTrigger>
                            <SelectContent>
                                {cuentasContables.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.codigo} — {c.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {cuentasContables.length === 0 && (
                            <p className="text-xs text-warning mt-1">
                                No hay cuentas de bancos (código 1.1.01.x) disponibles en el plan de cuentas.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !cuentaContableId}>
                            {loading ? 'Guardando...' : 'Guardar Cuenta'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
