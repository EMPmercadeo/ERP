'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateUserStatusAndRole } from '@/lib/actions/admin';
import { ShieldAlert, UserCheck, UserX, Loader2 } from 'lucide-react';

interface UserRowActionsProps {
    userId: string;
    initialRole: string;
    initialActive: boolean;
}

export function UserRowActions({ userId, initialRole, initialActive }: UserRowActionsProps) {
    const [role, setRole] = useState(initialRole);
    const [active, setActive] = useState(initialActive);
    const [isPending, startTransition] = useTransition();

    const handleRoleChange = async (newRole: string) => {
        setRole(newRole);
        startTransition(async () => {
            const res = await updateUserStatusAndRole(userId, newRole, active);
            if (!res.success) {
                // Revert on failure
                setRole(role);
                alert(res.error || 'Error al actualizar el rol');
            }
        });
    };

    const handleStatusToggle = async () => {
        const newActive = !active;
        setActive(newActive);
        startTransition(async () => {
            const res = await updateUserStatusAndRole(userId, role, newActive);
            if (!res.success) {
                // Revert on failure
                setActive(active);
                alert(res.error || 'Error al actualizar el estado');
            }
        });
    };

    return (
        <div className="flex items-center gap-3 justify-end">
            {/* Role Select */}
            <Select
                value={role}
                onValueChange={handleRoleChange}
                disabled={isPending}
            >
                <SelectTrigger className="w-[140px] h-8 text-xs bg-white border border-border hover:bg-slate-50">
                    <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="contador">Contador</SelectItem>
                </SelectContent>
            </Select>

            {/* Status Toggle Button */}
            <Button
                size="sm"
                variant={active ? "outline" : "outline"}
                className={`h-8 gap-1.5 text-xs px-2.5 font-medium transition-colors ${
                    active
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800'
                        : 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800'
                }`}
                onClick={handleStatusToggle}
                disabled={isPending}
                title={active ? 'Desactivar usuario' : 'Activar usuario'}
            >
                {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : active ? (
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                    <UserX className="h-3.5 w-3.5 text-rose-600" />
                )}
                <span>{active ? 'Activo' : 'Inactivo'}</span>
            </Button>
        </div>
    );
}
