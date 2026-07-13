'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Loader2 } from 'lucide-react';
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
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateBankAccount } from '@/lib/actions/bank-accounts';
import { BankAccountData } from './BankAccountList';
import { CuentaContableOption } from './NewBankAccountModal';

interface EditBankAccountModalProps {
    cuenta: BankAccountData;
    cuentasContables: CuentaContableOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updated: BankAccountData) => void;
}

export function EditBankAccountModal({
    cuenta,
    cuentasContables,
    open,
    onOpenChange,
    onSuccess,
}: EditBankAccountModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: cuenta.nombre,
        banco: cuenta.banco,
        numeroCuenta: cuenta.numeroCuenta,
        tipoCuenta: cuenta.tipoCuenta,
        cuentaContableId: cuenta.cuentaContableId,
        saldoInicial: cuenta.saldoInicial.toString(),
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await updateBankAccount(cuenta.id, {
                nombre: formData.nombre,
                banco: formData.banco,
                numeroCuenta: formData.numeroCuenta,
                tipoCuenta: formData.tipoCuenta,
                cuentaContableId: formData.cuentaContableId,
                saldoInicial: formData.saldoInicial ? Number(formData.saldoInicial) : 0,
            });

            if (res.success && res.data) {
                toast.success('Cuenta bancaria actualizada correctamente');
                const cuentaContable = cuentasContables.find((c) => c.id === res.data.cuentaContableId);
                onSuccess({
                    ...cuenta,
                    ...res.data,
                    cuentaContableCodigo: cuentaContable?.codigo || cuenta.cuentaContableCodigo,
                    cuentaContableNombre: cuentaContable?.nombre || cuenta.cuentaContableNombre,
                });
                onOpenChange(false);
            } else {
                toast.error(res.error || 'Error al actualizar la cuenta bancaria');
            }
        } catch {
            toast.error('Error inesperado al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Edit className="h-5 w-5 text-brand-1" />
                        Editar Cuenta Bancaria
                    </DialogTitle>
                    <DialogDescription>
                        Modifica los datos de la cuenta bancaria y su vínculo contable.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div>
                        <Label>Nombre de la Cuenta *</Label>
                        <Input required value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Banco *</Label>
                            <Input required value={formData.banco} onChange={(e) => handleChange('banco', e.target.value)} />
                        </div>
                        <div>
                            <Label>Número de Cuenta *</Label>
                            <Input required value={formData.numeroCuenta} onChange={(e) => handleChange('numeroCuenta', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Tipo de Cuenta</Label>
                            <Select value={formData.tipoCuenta} onValueChange={(v) => handleChange('tipoCuenta', v)}>
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
                            <Label>Saldo Inicial ($)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.saldoInicial}
                                onChange={(e) => handleChange('saldoInicial', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Cuenta Contable Vinculada *</Label>
                        <Select value={formData.cuentaContableId} onValueChange={(v) => handleChange('cuentaContableId', v)}>
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
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
