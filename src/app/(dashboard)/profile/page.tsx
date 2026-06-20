'use client';

import { useAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { updatePersonalInfo, changePassword } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [isPersonalLoading, setIsPersonalLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Derived state
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handlePersonalInfoSubmit = async (formData: FormData) => {
        if (!user?.email) return;

        setIsPersonalLoading(true);
        try {
            const result = await updatePersonalInfo(user.email, formData);
            if (result.success) {
                toast.success(result.message);
                await refreshUser();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al actualizar información');
        } finally {
            setIsPersonalLoading(false);
        }
    };

    const handlePasswordSubmit = async (formData: FormData) => {
        if (!user?.email) return;

        setIsPasswordLoading(true);
        try {
            const result = await changePassword(user.email, formData);
            if (result.success) {
                toast.success(result.message);
                // Optional: Clear form
                const form = document.getElementById('passwordForm') as HTMLFormElement;
                form?.reset();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al cambiar contraseña');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <>
            <Topbar title="Mi Perfil" />
            <ContentContainer>
                <div className="mx-auto max-w-4xl space-y-8">

                    {/* Header Card */}
                    <div className="flex flex-col md:flex-row items-center gap-6 rounded-xl border bg-card p-8 shadow-sm">
                        <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                            {user?.photoURL && <AvatarImage src={user.photoURL} />}
                            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">{displayName}</h2>
                            <p className="text-muted-foreground font-medium">{user?.email}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    Super Admin
                                </span>
                                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                                    Cuenta Activa
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Personal Info Form */}
                        <Card className="h-fit">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-primary" />
                                    <CardTitle>Información Personal</CardTitle>
                                </div>
                                <CardDescription>
                                    Datos básicos de tu cuenta en el sistema.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={handlePersonalInfoSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Nombre Completo</Label>
                                        <Input
                                            name="fullName"
                                            id="fullName"
                                            defaultValue={displayName}
                                            placeholder="Ej. Ernesto Morrison"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-muted text-muted-foreground"
                                        />
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            El correo no se puede cambiar.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input
                                            name="phone"
                                            id="phone"
                                            placeholder="+507 6000-0000"
                                            defaultValue=""
                                        />
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isPersonalLoading}>
                                            {isPersonalLoading ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Security Form */}
                        <Card className="h-fit border-orange-100">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-orange-600" />
                                    <CardTitle>Seguridad y Contraseña</CardTitle>
                                </div>
                                <CardDescription>
                                    Actualiza tu contraseña. Se requiere la anterior por seguridad.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form id="passwordForm" action={handlePasswordSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                        <div className="relative">
                                            <Input
                                                name="currentPassword"
                                                id="currentPassword"
                                                type={showCurrentPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                        <div className="relative">
                                            <Input
                                                name="newPassword"
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                        <Input
                                            name="confirmPassword"
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Repite la nueva contraseña"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" variant="secondary" disabled={isPasswordLoading}>
                                            {isPasswordLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ContentContainer>
        </>
    );
}
