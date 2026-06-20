import { Suspense } from 'react';
import { getGlobalUsers } from '@/lib/actions/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ContentContainer } from '@/components/layout/Content';
import { Badge } from '@/components/ui/badge';
import { UserFilters } from './UserFilters';
import { UserRowActions } from './UserRowActions';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        search?: string;
        role?: string;
        status?: string;
    }>;
}

export default async function AdminUsersPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const search = searchParams?.search || '';
    const role = searchParams?.role || 'all';
    const status = searchParams?.status || 'all';

    const users = await getGlobalUsers(search, role, status);

    const getRoleBadge = (userRole: string) => {
        switch (userRole) {
            case 'super_admin':
                return (
                    <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 font-semibold gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Super Admin
                    </Badge>
                );
            case 'admin':
                return (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-semibold gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                    </Badge>
                );
            case 'contador':
                return (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-medium">
                        Contador
                    </Badge>
                );
            case 'vendedor':
            default:
                return (
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 font-medium">
                        Vendedor
                    </Badge>
                );
        }
    };

    return (
        <ContentContainer className="py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuarios Globales</h1>
                    <p className="text-muted-foreground">Gestión y control de acceso de todos los usuarios en la plataforma</p>
                </div>
            </div>

            {/* Filters */}
            <Suspense fallback={<div className="h-10 bg-slate-100 animate-pulse rounded-md mb-6" />}>
                <UserFilters />
            </Suspense>

            {/* User List Table */}
            <div className="rounded-md border bg-white shadow overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="font-semibold">Usuario</TableHead>
                            <TableHead className="font-semibold">Rol Actual</TableHead>
                            <TableHead className="font-semibold">Empresa Asociada</TableHead>
                            <TableHead className="font-semibold">Fecha Registro</TableHead>
                            <TableHead className="font-semibold">Último Acceso</TableHead>
                            <TableHead className="text-right font-semibold pr-6">Acciones de Gestión</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No se encontraron usuarios con los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{user.nombre}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.rol)}</TableCell>
                                    <TableCell className="text-slate-700 font-medium">{user.empresaName}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {user.lastLogin 
                                            ? format(new Date(user.lastLogin), 'dd MMM yyyy HH:mm', { locale: es })
                                            : 'Nunca'
                                        }
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <UserRowActions
                                            userId={user.id}
                                            initialRole={user.rol}
                                            initialActive={user.activo}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </ContentContainer>
    );
}
