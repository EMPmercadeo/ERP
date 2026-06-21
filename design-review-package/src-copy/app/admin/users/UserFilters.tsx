'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export function UserFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(searchParams.get('search') || '');

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete('page');

        startTransition(() => {
            router.push(`/admin/users?${params.toString()}`);
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters('search', search);
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre o correo..."
                    className="pl-9 h-10 w-full bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => updateFilters('search', search)}
                />
            </form>

            <div className="flex flex-wrap items-center gap-3">
                {/* Role Filter */}
                <Select
                    value={searchParams.get('role') || 'all'}
                    onValueChange={(val) => updateFilters('role', val)}
                    disabled={isPending}
                >
                    <SelectTrigger className="w-[165px] h-10 bg-white">
                        <SelectValue placeholder="Filtrar por Rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Roles</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="contador">Contador</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                    value={searchParams.get('status') || 'all'}
                    onValueChange={(val) => updateFilters('status', val)}
                    disabled={isPending}
                >
                    <SelectTrigger className="w-[165px] h-10 bg-white">
                        <SelectValue placeholder="Filtrar por Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Estados</SelectItem>
                        <SelectItem value="active">Activos</SelectItem>
                        <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
