'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { updatePersonalInfo, changePassword, listWebAuthnCredentials, deleteWebAuthnCredential } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, User as UserIcon, MailWarning, MailCheck, Building2, CreditCard, Shield, ArrowRight, FileText, CheckCircle2, History, Settings as SettingsIcon, HelpCircle, Users, FileClock, Fingerprint, Trash2, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { startRegistration, browserSupportsWebAuthn, WebAuthnError } from '@simplewebauthn/browser';

export interface ProfileOverviewData {
    user: {
        id: string;
        nombre: string;
        email: string;
        rol: string;
        activo: boolean;
        createdAt: Date;
        lastLogin: Date | null;
    };
    empresa: {
        id: string;
        razonSocial: string;
        nombreComercial: string;
        ruc: string;
        dv: string;
        direccion: string;
        telefono: string;
        email: string;
        logo: string | null;
        ambienteDgi: string;
        certificadoDgi: string;
        planType: string;
        fiscalEnabled: boolean;
        subscriptionStatus: string;
    };
    billing: {
        planName: string;
        priceMonthly: number;
        status: string;
        currentPeriodEnd: Date | null;
        foliosIncluded: number;
        foliosUsed: number;
        foliosExtra: number;
        foliosRemaining: number;
    };
}

export function ProfileTabsView({ overviewData }: { overviewData: ProfileOverviewData | null }) {
    const { user, role, refreshUser, isEmailVerified, resendVerificationEmail } = useAuth();
    const [isPersonalLoading, setIsPersonalLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isResendingVerification, setIsResendingVerification] = useState(false);

    // --- Passkeys (login biométrico real vía WebAuthn) ---
    type PasskeyCredential = {
        id: string;
        nombre: string | null;
        deviceType: string | null;
        createdAt: Date;
        lastUsedAt: Date | null;
    };
    const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
    const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(true);
    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
    const [webauthnSupported, setWebauthnSupported] = useState(true);

    const loadPasskeys = useCallback(async () => {
        try {
            const data = await listWebAuthnCredentials();
            setPasskeys(data);
        } catch {
            // Silencioso: si falla, simplemente se muestra la lista vacía.
        } finally {
            setIsLoadingPasskeys(false);
        }
    }, []);

    useEffect(() => {
        setWebauthnSupported(browserSupportsWebAuthn());
        loadPasskeys();
    }, [loadPasskeys]);

    const handleRegisterPasskey = async () => {
        setIsRegisteringPasskey(true);
        try {
            const optionsRes = await fetch('/api/auth/webauthn/register/options', { method: 'POST' });
            const optionsJSON = await optionsRes.json();
            if (!optionsRes.ok) {
                throw new Error(optionsJSON?.error || 'No se pudo iniciar el registro.');
            }

            const registrationResponse = await startRegistration({ optionsJSON });

            const deviceName = typeof navigator !== 'undefined' && /iphone|ipad/i.test(navigator.userAgent)
                ? 'iPhone/iPad'
                : typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
                    ? 'Android'
                    : 'Este dispositivo';

            const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...registrationResponse, nombre: deviceName })
            });
            const verifyJSON = await verifyRes.json();
            if (!verifyRes.ok || !verifyJSON.verified) {
                throw new Error(verifyJSON?.error || 'No se pudo verificar el dispositivo.');
            }

            toast.success('Dispositivo registrado. Ya puedes usar huella/Face ID para iniciar sesión.');
            await loadPasskeys();
        } catch (err) {
            if (err instanceof WebAuthnError && err.code === 'ERROR_CEREMONY_ABORTED') {
                // Cancelado por el usuario, no es un error real.
            } else {
                toast.error(err instanceof Error ? err.message : 'No se pudo registrar el dispositivo.');
            }
        } finally {
            setIsRegisteringPasskey(false);
        }
    };

    const handleDeletePasskey = async (id: string) => {
        const previous = passkeys;
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
        const result = await deleteWebAuthnCredential(id);
        if (!result.success) {
            toast.error(result.message);
            setPasskeys(previous);
        } else {
            toast.success(result.message);
        }
    };

    const handleResendVerification = async () => {
        setIsResendingVerification(true);
        try {
            await resendVerificationEmail();
            toast.success('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
        } catch {
            toast.error('No se pudo reenviar el correo de verificación. Intenta de nuevo en unos minutos.');
        } finally {
            setIsResendingVerification(false);
        }
    };

    // Derived state
    const displayName = user?.displayName || overviewData?.user?.nombre || user?.email?.split('@')[0] || 'Usuario';
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const effectiveRole = role || overviewData?.user?.rol || 'usuario';
    const roleLabel = effectiveRole === 'super_admin' ? 'Super Admin' :
        effectiveRole === 'admin' ? 'Administrador' :
            effectiveRole === 'contador' ? 'Contador' :
                effectiveRole === 'vendedor' ? 'Vendedor' : 'Usuario';

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
        } catch {
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
                const form = document.getElementById('passwordForm') as HTMLFormElement;
                form?.reset();
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error('Error al cambiar contraseña');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const quickLinks = [
        { name: 'Ajustes de la Empresa', href: '/settings', icon: SettingsIcon, description: 'DGI, usuarios, planes e integraciones' },
        { name: 'Centro de Ayuda', href: '/help', icon: HelpCircle, description: 'Soporte 24/7 y guías de uso' },
        ...(effectiveRole === 'super_admin' ? [
            { name: 'Empresas Registradas', href: '/admin/empresas', icon: Building2, description: 'Ver y editar todas las cuentas' },
            { name: 'Usuarios del Sistema', href: '/admin/users', icon: Users, description: 'Gestión global de usuarios' },
            { name: 'Auditoría', href: '/admin/audit', icon: FileClock, description: 'Registro de actividad global' },
        ] : []),
    ];

    return (
        <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
            {/* Super Admin Banner */}
            {effectiveRole === 'super_admin' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-warning/30 bg-warning-bg shadow-sm text-warning">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning text-white shadow-sm">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">Modo Super Admin Activo</h3>
                            <p className="text-xs text-warning/80">Tienes privilegios globales para gestionar todas las empresas, usuarios y facturación del sistema.</p>
                        </div>
                    </div>
                    <Link href="/admin">
                        <Button className="bg-warning hover:bg-warning/90 text-white shadow-sm">
                            Ir al Panel de Administración
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Header Card */}
            <div className="flex flex-col md:flex-row items-center gap-6 rounded-xl border bg-card p-4 sm:p-8 shadow-sm">
                <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                    {user?.photoURL && <AvatarImage src={user.photoURL} />}
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left space-y-2 flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">{displayName}</h2>
                    <p className="text-muted-foreground font-medium">{user?.email || overviewData?.user?.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                        <span className="inline-flex items-center rounded-full bg-info-bg px-3 py-1 text-xs font-semibold text-info ring-1 ring-inset ring-info/20 uppercase tracking-wide">
                            {roleLabel}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success ring-1 ring-inset ring-success/20">
                            Cuenta Activa
                        </span>
                        {isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success ring-1 ring-inset ring-success/20">
                                <MailCheck className="h-3 w-3" /> Correo Verificado
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-3 py-1 text-xs font-semibold text-warning ring-1 ring-inset ring-warning/20">
                                <MailWarning className="h-3 w-3" /> Correo sin verificar
                            </span>
                        )}
                    </div>
                    {!isEmailVerified && (
                        <div className="flex flex-col items-center md:items-start gap-1 pt-1">
                            <p className="text-xs text-muted-foreground max-w-sm">
                                Algunas acciones (como enviar correos a proveedores o clientes) requieren que verifiques tu email primero.
                            </p>
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={handleResendVerification}
                                disabled={isResendingVerification}
                            >
                                {isResendingVerification ? 'Reenviando...' : 'Reenviar correo de verificación'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs View */}
            <Tabs defaultValue="cuenta" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="cuenta" className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Cuenta
                    </TabsTrigger>
                    <TabsTrigger value="empresa" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Mi Empresa
                    </TabsTrigger>
                    <TabsTrigger value="facturacion" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Facturación
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: CUENTA */}
                <TabsContent value="cuenta" className="space-y-6">
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
                                            value={user?.email || overviewData?.user?.email || ''}
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
                        <Card className="h-fit border-warning/30">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-warning" />
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

                    {/* Passkeys / Login Biométrico */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Fingerprint className="h-5 w-5 text-primary" />
                                <CardTitle>Login Biométrico (Huella / Face ID)</CardTitle>
                            </div>
                            <CardDescription>
                                Registra este dispositivo para iniciar sesión con huella, Face ID o Windows Hello, sin escribir tu contraseña.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!webauthnSupported && (
                                <p className="text-sm text-warning bg-warning-bg rounded-lg p-3 border border-warning/20">
                                    Este navegador no soporta login biométrico (WebAuthn). Prueba desde Chrome, Safari o Edge actualizados.
                                </p>
                            )}

                            {isLoadingPasskeys ? (
                                <p className="text-sm text-muted-foreground">Cargando dispositivos...</p>
                            ) : passkeys.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Todavía no tienes ningún dispositivo registrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {passkeys.map((pk) => (
                                        <div key={pk.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/40">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Smartphone className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{pk.nombre || 'Dispositivo sin nombre'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Registrado el {new Date(pk.createdAt).toLocaleDateString('es-PA')}
                                                        {pk.lastUsedAt ? ` · Último uso: ${new Date(pk.lastUsedAt).toLocaleDateString('es-PA')}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive shrink-0"
                                                onClick={() => handleDeletePasskey(pk.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="button"
                                    onClick={handleRegisterPasskey}
                                    disabled={isRegisteringPasskey || !webauthnSupported}
                                >
                                    <Fingerprint className="h-4 w-4 mr-2" />
                                    {isRegisteringPasskey ? 'Registrando...' : 'Registrar este dispositivo'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: MI EMPRESA */}
                <TabsContent value="empresa" className="space-y-6">
                    {!overviewData?.empresa ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No se pudo cargar la información de la empresa asociada a este usuario.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        <CardTitle>Datos de la Empresa</CardTitle>
                                    </div>
                                    <CardDescription>Información fiscal y comercial registrada</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Razón Social</p>
                                            <p className="text-sm font-semibold">{overviewData.empresa.razonSocial}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">RUC / DV</p>
                                            <p className="text-sm font-semibold">{overviewData.empresa.ruc} - {overviewData.empresa.dv}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Nombre Comercial</p>
                                            <p className="text-sm">{overviewData.empresa.nombreComercial}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Teléfono</p>
                                            <p className="text-sm">{overviewData.empresa.telefono}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Dirección</p>
                                        <p className="text-sm">{overviewData.empresa.direccion}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Email de Contacto</p>
                                        <p className="text-sm">{overviewData.empresa.email}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-info" />
                                        <CardTitle>Facturación Electrónica y DGI</CardTitle>
                                    </div>
                                    <CardDescription>Estado de conexión y folios fiscales disponibles</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted border">
                                        <div>
                                            <p className="text-sm font-medium">Ambiente DGI</p>
                                            <p className="text-xs text-muted-foreground">Entorno de emisión actual</p>
                                        </div>
                                        <Badge variant={overviewData.empresa.ambienteDgi === 'Producción' ? 'default' : 'secondary'}>
                                            {overviewData.empresa.ambienteDgi}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted border">
                                        <div>
                                            <p className="text-sm font-medium">Certificado Digital DGI</p>
                                            <p className="text-xs text-muted-foreground">Firma electrónica de documentos</p>
                                        </div>
                                        <Badge variant="success">
                                            {overviewData.empresa.certificadoDgi}
                                        </Badge>
                                    </div>

                                    {overviewData.billing && (
                                        <div className="space-y-2 p-4 rounded-lg border border-info/20 bg-info-bg/70">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>Saldo de Folios FE</span>
                                                <span className="text-info font-bold">
                                                    {overviewData.billing.foliosRemaining} disponibles
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-info h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, Math.round((overviewData.billing.foliosUsed / Math.max(1, overviewData.billing.foliosIncluded + overviewData.billing.foliosExtra)) * 100))}%`
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                                <span>Usados: {overviewData.billing.foliosUsed}</span>
                                                <span>Límite Total: {overviewData.billing.foliosIncluded + overviewData.billing.foliosExtra}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* TAB 3: FACTURACIÓN */}
                <TabsContent value="facturacion" className="space-y-6">
                    {!overviewData?.billing ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No hay datos de facturación disponibles para este inquilino.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-success" />
                                        <CardTitle>Plan y Suscripción</CardTitle>
                                    </div>
                                    <CardDescription>Resumen de tu suscripción en ERP Panamá</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Plan Actual</p>
                                            <h3 className="text-2xl font-bold uppercase tracking-tight text-primary mt-0.5">
                                                {overviewData.billing.planName}
                                            </h3>
                                        </div>
                                        <Badge variant="success" className="px-3 py-1 text-xs uppercase font-semibold">
                                            {overviewData.billing.status === 'active' || overviewData.billing.status === 'Activa' ? 'Suscripción Activa' : overviewData.billing.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Precio Mensual</p>
                                            <p className="text-lg font-semibold">${overviewData.billing.priceMonthly.toFixed(2)} USD</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Próximo Cobro</p>
                                            <p className="text-sm font-medium mt-1">
                                                {overviewData.billing.currentPeriodEnd
                                                    ? new Date(overviewData.billing.currentPeriodEnd).toLocaleDateString('es-PA')
                                                    : 'Renovación automática'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <History className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle>Historial de Pagos</CardTitle>
                                    </div>
                                    <CardDescription>Registro de facturas y cobros de tu suscripción</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border rounded-lg bg-muted/50 border-dashed">
                                        <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium text-foreground">Sin cobros pendientes</p>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                            No hay pagos de suscripción registrados recientemente en este ciclo.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Accesos Rápidos — para no dejar el perfil tan vacío y facilitar navegación */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Accesos Rápidos</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link key={link.href} href={link.href}>
                                <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold truncate">{link.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
