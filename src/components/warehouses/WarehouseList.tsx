'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Warehouse,
    Trash2,
    Search,
} from 'lucide-react';
import { deleteBodega } from '@/lib/actions/bodegas';
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
import { NewWarehouseModal, SucursalOption } from './NewWarehouseModal';
import { EditWarehouseModal } from './EditWarehouseModal';

export interface BodegaListItem {
    id: string;
    codigo: string;
    nombre: string;
    sucursalId: string;
    sucursalNombre: string;
    activa: boolean;
}

export function WarehouseList({
    initialData,
    sucursales,
}: {
    initialData: BodegaListItem[];
    sucursales: SucursalOption[];
}) {
    const [search, setSearch] = useState('');
    const [bodegas, setBodegas] = useState<BodegaListItem[]>(initialData);
    const router = useRouter();

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        return bodegas.filter((b) =>
            !query ||
            b.nombre.toLowerCase().includes(query) ||
            b.codigo.toLowerCase().includes(query) ||
            b.sucursalNombre.toLowerCase().includes(query)
        );
    }, [bodegas, search]);

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta bodega? Esta acción es irreversible.')) {
            try {
                const res = await deleteBodega(id);
                if (res.success) {
                    toast.success(res.message);
                    setBodegas((prev) => prev.filter((b) => b.id !== id));
                    router.refresh();
                } else {
                    toast.error(res.error || 'Error al eliminar la bodega');
                }
            } catch {
                toast.error('Error al conectar con el servidor.');
            }
        }
    };

    return (
        <ContentContainer>
            <div className="flex flex-col gap-6">
                {/* Headers and Quick Stats */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Gestión de Bodegas</h1>
                        <p className="text-sm text-slate-500">
                            Administra los almacenes físicos y de inventario de tu comercio.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <NewWarehouseModal sucursales={sucursales} />
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por código, nombre o sucursal..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 pl-9 border-slate-200 focus-visible:ring-brand-1 text-sm rounded-lg"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table Container */}
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[10%]">Código</TableHead>
                                    <TableHead className="w-[30%]">Nombre</TableHead>
                                    <TableHead className="w-[30%]">Sucursal</TableHead>
                                    <TableHead className="w-[15%]">Estado</TableHead>
                                    <TableHead className="text-right w-[15%]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Warehouse className="h-8 w-8 text-slate-300" />
                                                <p className="text-sm font-medium">No se encontraron bodegas</p>
                                                <p className="text-xs">
                                                    Intenta con otra búsqueda o registra una nueva bodega.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((b) => (
                                        <TableRow key={b.id} className="hover:bg-slate-50/30">
                                            <TableCell className="font-mono font-medium text-slate-700">
                                                {b.codigo}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                {b.nombre}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {b.sucursalNombre}
                                            </TableCell>
                                            <TableCell>
                                                {b.activa ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200">
                                                        Activa
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-50 border border-slate-200">
                                                        Inactiva
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <EditWarehouseModal
                                                        bodega={{
                                                            id: b.id,
                                                            codigo: b.codigo,
                                                            nombre: b.nombre,
                                                            sucursalId: b.sucursalId,
                                                            activa: b.activa,
                                                        }}
                                                        sucursales={sucursales}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(b.id)}
                                                        className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </ContentContainer>
    );
}
