'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Landmark,
    Edit,
    Trash2,
    Eye,
    MoreHorizontal,
    CheckCircle2,
    Ban,
    Search,
} from 'lucide-react';
import { deleteBankAccount, toggleBankAccountStatus } from '@/lib/actions/bank-accounts';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewBankAccountModal, CuentaContableOption } from './NewBankAccountModal';
import { EditBankAccountModal } from './EditBankAccountModal';

export interface BankAccountData {
    id: string;
    nombre: string;
    banco: string;
    numeroCuenta: string;
    tipoCuenta: string;
    cuentaContableId: string;
    cuentaContableCodigo: string;
    cuentaContableNombre: string;
    saldoInicial: number;
    activa: boolean;
    totalMovimientos: number;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value);
}

export function BankAccountList({
    initialData,
    cuentasContables,
}: {
    initialData: BankAccountData[];
    cuentasContables: CuentaContableOption[];
}) {
    const [search, setSearch] = useState('');
    const [cuentas, setCuentas] = useState<BankAccountData[]>(initialData);
    const [editingCuenta, setEditingCuenta] = useState<BankAccountData | null>(null);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        return cuentas.filter((c) =>
            !query ||
            c.nombre.toLowerCase().includes(query) ||
            c.banco.toLowerCase().includes(query) ||
            c.numeroCuenta.toLowerCase().includes(query)
        );
    }, [cuentas, search]);

    const handleToggleStatus = async (id: string, nuevaActiva: boolean) => {
        const res = await toggleBankAccountStatus(id, nuevaActiva);
        if (res.success) {
            toast.success(res.message);
            setCuentas((prev) => prev.map((c) => (c.id === id ? { ...c, activa: nuevaActiva } : c)));
        } else {
            toast.error(res.error || 'Error al cambiar estado');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar/desactivar esta cuenta bancaria?')) {
            const res = await deleteBankAccount(id);
            if (res.success) {
                toast.success(res.message);
                setCuentas((prev) =>
                    res.deactivated
                        ? prev.map((c) => (c.id === id ? { ...c, activa: false } : c))
                        : prev.filter((c) => c.id !== id)
                );
            } else {
                toast.error(res.error || 'Error al eliminar');
            }
        }
    };

    return (
        <ContentContainer className="py-4 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Cuentas Bancarias</h2>
                    <p className="text-muted-foreground text-sm">
                        Administra las cuentas bancarias de la empresa y su vínculo con el plan de cuentas
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <NewBankAccountModal cuentasContables={cuentasContables} />
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, banco o número de cuenta..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-card h-9 text-xs"
                        />
                    </div>

                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/80">
                                <TableRow>
                                    <TableHead>Cuenta</TableHead>
                                    <TableHead>Banco</TableHead>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Cuenta Contable</TableHead>
                                    <TableHead className="text-right">Saldo Inicial</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((c) => (
                                        <TableRow key={c.id} className="hover:bg-accent/60">
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brand-1 text-white shrink-0">
                                                        <Landmark className="h-4 w-4" />
                                                    </div>
                                                    <Link href={`/bank-accounts/${c.id}`} className="font-semibold text-foreground hover:text-brand-1">
                                                        {c.nombre}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-foreground">{c.banco}</TableCell>
                                            <TableCell className="font-mono text-xs">{c.numeroCuenta}</TableCell>
                                            <TableCell className="text-xs capitalize">{c.tipoCuenta.toLowerCase()}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {c.cuentaContableCodigo} — {c.cuentaContableNombre}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">{formatCurrency(c.saldoInicial)}</TableCell>
                                            <TableCell>
                                                <Badge variant={c.activa ? 'success' : 'destructive'} className="text-[10px] capitalize">
                                                    {c.activa ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/bank-accounts/${c.id}`}>
                                                        <Button variant="ghost" size="icon" aria-label="Ver detalle" className="h-8 w-8 text-muted-foreground hover:text-brand-1 hover:bg-brand-1/10" title="Ver Detalle">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Editar cuenta bancaria"
                                                        className="h-8 w-8 text-muted-foreground hover:text-warning hover:bg-warning-bg"
                                                        title="Editar"
                                                        onClick={() => setEditingCuenta(c)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            {c.activa ? (
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(c.id, false)} className="text-warning cursor-pointer">
                                                                    <Ban className="mr-2 h-4 w-4" /> Desactivar
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(c.id, true)} className="text-success cursor-pointer">
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivar
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                                            No se encontraron cuentas bancarias registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {editingCuenta && (
                <EditBankAccountModal
                    cuenta={editingCuenta}
                    cuentasContables={cuentasContables}
                    open={!!editingCuenta}
                    onOpenChange={(open) => {
                        if (!open) setEditingCuenta(null);
                    }}
                    onSuccess={(updated) => {
                        setCuentas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                    }}
                />
            )}
        </ContentContainer>
    );
}
