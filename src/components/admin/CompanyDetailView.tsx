'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Power, Edit2, ArrowLeft, Users, FileText, ShoppingBag, UserCheck, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { startImpersonation } from '@/lib/actions/impersonate';
import { toggleTenantStatus, updateTenant } from '@/lib/actions/admin';

export interface TenantDetailData {
    id: string;
    razonSocial: string;
    nombreComercial: string;
    ruc: string;
    dv: string;
    direccion: string;
    telefono: string;
    email: string;
    ambiente: string;
    planType: string;
    fiscalEnabled: boolean;
    subscriptionStatus: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    usuarios: Array<{
        id: string;
        nombre: string;
        email: string;
        rol: string;
        activo: boolean;
        createdAt: Date;
        lastLogin: Date | null;
    }>;
    counts: {
        usuarios: number;
        facturas: number;
        clientes: number;
        productos: number;
    };
}

export function CompanyDetailView({ company }: { company: TenantDetailData }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [razonSocial, setRazonSocial] = useState(company.razonSocial);
    const [nombreComercial, setNombreComercial] = useState(company.nombreComercial === 'N/A' ? '' : company.nombreComercial);
    const [direccion, setDireccion] = useState(company.direccion);
    const [telefono, setTelefono] = useState(company.telefono === 'N/A' ? '' : company.telefono);
    const [email, setEmail] = useState(company.email === 'N/A' ? '' : company.email);
    const [planType, setPlanType] = useState(company.planType);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await updateTenant(company.id, {
                razonSocial,
                nombreComercial: nombreComercial || undefined,
                direccion,
                telefono: telefono || undefined,
                email: email || undefined,
                planType
            });
            if (res.success) {
                toast.success('Empresa actualizada correctamente');
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error(res.error || 'Error al actualizar');
            }
        } catch (_error) {
            toast.error('Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        const res = await toggleTenantStatus(company.id);
        if (res.success) {
            toast.success(`Empresa ${res.newStatus === 'active' ? 'reactivada' : 'suspendida'} exitosamente`);
            router.refresh();
        } else {
            toast.error(res.error || 'Error al cambiar estado');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/empresas">
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Volver al listado de empresas">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">{company.razonSocial}</h1>
                        <Badge variant={company.status === 'Activa' ? 'success' : 'destructive'}>
                            {company.status}
                        </Badge>
                        <Badge variant={company.ambiente === 'Producción' ? 'default' : 'secondary'}>
                            {company.ambiente}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-11">
                        RUC: {company.ruc} - DV: {company.dv} | Creada: {new Date(company.createdAt).toLocaleDateString('es-PA')}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <form action={async () => {
                        await startImpersonation(company.id);
                    }}>
                        <Button variant="outline" type="submit" className="text-warning border-warning/30 hover:bg-warning-bg">
                            <Shield className="h-4 w-4 mr-2" />
                            Impersonar
                        </Button>
                    </form>

                    <Button
                        variant={company.status === 'Activa' ? 'destructive' : 'default'}
                        onClick={handleToggleStatus}
                    >
                        <Power className="h-4 w-4 mr-2" />
                        {company.status === 'Activa' ? 'Suspender' : 'Reactivar'}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                        {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuarios Asignados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{company.counts.usuarios}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{company.counts.facturas}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{company.counts.clientes}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Productos en Catálogo</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{company.counts.productos}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Form / Details Section */}
            {isEditing ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Editar Información de Empresa</CardTitle>
                        <CardDescription>Modifica los datos generales y de suscripción del inquilino</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Razón Social</label>
                                    <Input
                                        value={razonSocial}
                                        onChange={(e) => setRazonSocial(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre Comercial</label>
                                    <Input
                                        value={nombreComercial}
                                        onChange={(e) => setNombreComercial(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Dirección</label>
                                    <Input
                                        value={direccion}
                                        onChange={(e) => setDireccion(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Teléfono</label>
                                    <Input
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Plan de Suscripción</label>
                                    <Input
                                        value={planType}
                                        onChange={(e) => setPlanType(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles Generales</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nombre Comercial</p>
                            <p className="text-base">{company.nombreComercial}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                            <p className="text-base">{company.direccion}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                            <p className="text-base">{company.telefono}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email de Contacto</p>
                            <p className="text-base">{company.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Plan de Suscripción</p>
                            <p className="text-base capitalize">{company.planType}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Facturación Fiscal Electrónica</p>
                            <p className="text-base">{company.fiscalEnabled ? 'Habilitada' : 'No Habilitada'}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Assigned Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Asignados</CardTitle>
                    <CardDescription>Lista de usuarios pertenecientes a esta empresa</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Último Acceso</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {company.usuarios.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No hay usuarios asignados a esta empresa.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                company.usuarios.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.nombre}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="capitalize">{user.rol}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.activo ? 'success' : 'destructive'}>
                                                {user.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.lastLogin
                                                ? new Date(user.lastLogin).toLocaleString('es-PA')
                                                : 'Nunca'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
