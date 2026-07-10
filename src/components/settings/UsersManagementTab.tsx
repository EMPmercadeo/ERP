'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, KeyRound, Percent, Loader2, Users } from 'lucide-react';
import {
    listCompanyUsers,
    inviteCompanyUser,
    updateCompanyUserRole,
    setMyDiscountPin,
    updateCompanyDiscountThreshold,
    getCompanyDiscountThreshold,
} from '@/lib/actions/company-users';
import { ASSIGNABLE_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLES_AUTORIZAN_DESCUENTOS } from '@/lib/permissions';

interface CompanyUser {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    activo: boolean;
    createdAt: string;
    lastLogin: string | null;
    tienePin: boolean;
    descuentoMaximoPermitido: number | null;
}

export function UsersManagementTab({ myRole }: { myRole: string }) {
    const [usuarios, setUsuarios] = useState<CompanyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [tope, setTope] = useState('10');
    const [guardandoTope, setGuardandoTope] = useState(false);

    // Formulario de invitación
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [rol, setRol] = useState('vendedor');
    const [invitando, setInvitando] = useState(false);

    // PIN propio
    const [pin, setPin] = useState('');
    const [guardandoPin, setGuardandoPin] = useState(false);

    const cargar = async () => {
        setLoading(true);
        try {
            const [data, topeActual] = await Promise.all([
                listCompanyUsers(),
                getCompanyDiscountThreshold(),
            ]);
            setUsuarios(data as CompanyUser[]);
            setTope(String(topeActual));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al cargar usuarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
         
    }, []);

    const handleInvitar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !email.trim()) return;
        setInvitando(true);
        try {
            const res = await inviteCompanyUser(nombre, email, rol);
            if (res.success) {
                toast.success(res.message);
                setNombre('');
                setEmail('');
                setRol('vendedor');
                cargar();
            } else {
                toast.error(res.error || 'No se pudo agregar el usuario.');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al agregar el usuario.');
        } finally {
            setInvitando(false);
        }
    };

    const handleCambiarRol = async (userId: string, nuevoRol: string) => {
        const usuario = usuarios.find(u => u.id === userId);
        if (!usuario) return;
        try {
            const res = await updateCompanyUserRole(userId, nuevoRol, usuario.activo);
            if (res.success) {
                toast.success('Rol actualizado.');
                cargar();
            } else {
                toast.error(res.error || 'No se pudo actualizar el rol.');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al actualizar el rol.');
        }
    };

    const handleToggleActivo = async (userId: string) => {
        const usuario = usuarios.find(u => u.id === userId);
        if (!usuario) return;
        try {
            const res = await updateCompanyUserRole(userId, usuario.rol, !usuario.activo);
            if (res.success) {
                toast.success(usuario.activo ? 'Usuario desactivado.' : 'Usuario reactivado.');
                cargar();
            } else {
                toast.error(res.error || 'No se pudo actualizar el usuario.');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al actualizar el usuario.');
        }
    };

    const handleGuardarPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardandoPin(true);
        try {
            const res = await setMyDiscountPin(pin);
            if (res.success) {
                toast.success(res.message);
                setPin('');
                cargar();
            } else {
                toast.error(res.error || 'No se pudo guardar el PIN.');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al guardar el PIN.');
        } finally {
            setGuardandoPin(false);
        }
    };

    const handleGuardarTope = async () => {
        setGuardandoTope(true);
        try {
            const res = await updateCompanyDiscountThreshold(parseFloat(tope) || 0);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.error || 'No se pudo guardar el tope.');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al guardar el tope.');
        } finally {
            setGuardandoTope(false);
        }
    };

    const puedoAutorizar = myRole === 'admin' || (ROLES_AUTORIZAN_DESCUENTOS as string[]).includes(myRole);

    return (
        <div className="space-y-6">
            {myRole !== 'admin' && (
                <Card>
                    <CardContent className="py-6 text-sm text-muted-foreground">
                        Solo el administrador (dueño) de la empresa puede invitar usuarios y cambiar roles. Tu rol actual es <strong>{ROLE_LABELS[myRole as keyof typeof ROLE_LABELS] || myRole}</strong>.
                    </CardContent>
                </Card>
            )}

            {myRole === 'admin' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4.5 w-4.5 text-brand-1" />Agregar Usuario a tu Equipo</CardTitle>
                        <CardDescription>
                            Se crea la cuenta ya vinculada a tu empresa. Cuando esa persona inicie sesión con este mismo correo (Google o correo/contraseña), entrará directo aquí con el rol que le asignes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvitar} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-medium text-foreground mb-1">Nombre</label>
                                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" required />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-medium text-foreground mb-1">Correo</label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-medium text-foreground mb-1">Rol</label>
                                <Select value={rol} onValueChange={setRol}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ASSIGNABLE_ROLES.filter(r => r !== 'admin').map((r) => (
                                            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="sm:col-span-1">
                                <Button type="submit" disabled={invitando} className="w-full">
                                    {invitando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                    Agregar
                                </Button>
                            </div>
                        </form>
                        <p className="text-xs text-muted-foreground mt-2">{ROLE_DESCRIPTIONS[rol as keyof typeof ROLE_DESCRIPTIONS]}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4.5 w-4.5 text-brand-1" />Usuarios de tu Empresa ({usuarios.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">Cargando usuarios...</div>
                    ) : usuarios.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">No hay usuarios registrados todavía.</div>
                    ) : (
                        <div className="space-y-2">
                            {usuarios.map((u) => (
                                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border rounded-lg p-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-foreground">{u.nombre}</span>
                                            <Badge variant={u.activo ? 'success' : 'neutral'} className="text-[10px]">{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                                            {u.tienePin && <Badge variant="info" className="text-[10px]"><KeyRound className="h-3 w-3 mr-1" />PIN configurado</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                    </div>
                                    {myRole === 'admin' ? (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Select value={u.rol} onValueChange={(v) => handleCambiarRol(u.id, v)}>
                                                <SelectTrigger className="h-8 text-xs w-[170px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {ASSIGNABLE_ROLES.map((r) => (
                                                        <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleToggleActivo(u.id)}>
                                                {u.activo ? 'Desactivar' : 'Reactivar'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Badge variant="neutral" className="text-[10px] shrink-0">{ROLE_LABELS[u.rol as keyof typeof ROLE_LABELS] || u.rol}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {puedoAutorizar && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4.5 w-4.5 text-brand-1" />Tu PIN de Autorización</CardTitle>
                        <CardDescription>
                            Como {ROLE_LABELS[myRole as keyof typeof ROLE_LABELS] || myRole}, puedes autorizar descuentos especiales en el POS con este PIN (4 a 8 dígitos), sin tener que cerrar la sesión del vendedor.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGuardarPin} className="flex items-end gap-3 max-w-sm">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-foreground mb-1">Nuevo PIN</label>
                                <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" required />
                            </div>
                            <Button type="submit" disabled={guardandoPin}>
                                {guardandoPin ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Guardar PIN
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {myRole === 'admin' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Percent className="h-4.5 w-4.5 text-brand-1" />Tope de Descuento sin Autorización</CardTitle>
                        <CardDescription>
                            Cualquier vendedor puede aplicar hasta este % de descuento en el POS libremente. Por encima, necesita el PIN de un admin/gerente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-3 max-w-xs">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-foreground mb-1">Tope (%)</label>
                                <Input type="number" min={0} max={100} step={0.5} value={tope} onChange={(e) => setTope(e.target.value)} />
                            </div>
                            <Button onClick={handleGuardarTope} disabled={guardandoTope}>
                                {guardandoTope ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Guardar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
