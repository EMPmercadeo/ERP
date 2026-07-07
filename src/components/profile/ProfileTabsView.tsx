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
import { updatePersonalInfo, changePassword } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, User as UserIcon, MailWarning, MailCheck, Building2, CreditCard, Shield, ArrowRight, FileText, CheckCircle2, History } from 'lucide-react';
import Link from 'next/link';

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

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            {/* Super Admin Banner */}
            {effectiveRole === 'super_admin' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm text-amber-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">Modo Super Admin Activo</h3>
                            <p className="text-xs text-amber-800">Tienes privilegios globales para gestionar todas las empresas, usuarios y facturación del sistema.</p>
                        </div>
                    </div>
                    <Link href="/admin">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                            Ir al Panel de Administración
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Header Card */}
            <div className="flex flex-col md:flex-row items-center gap-6 rounded-xl border bg-card p-8 shadow-sm">
                <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                    {user?.photoURL && <AvatarImage src={user.photoURL} />}
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left space-y-2 flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">{displayName}</h2>
                    <p className="text-muted-foreground font-medium">{user?.email || overviewData?.user?.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase tracking-wide">
                            {roleLabel}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                            Cuenta Activa
                        </span>
                        {isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                                <MailCheck className="h-3 w-3" /> Correo Verificado
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
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
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <CardTitle>Facturación Electrónica y DGI</CardTitle>
                                    </div>
                                    <CardDescription>Estado de conexión y folios fiscales disponibles</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                                        <div>
                                            <p className="text-sm font-medium">Ambiente DGI</p>
                                            <p className="text-xs text-muted-foreground">Entorno de emisión actual</p>
                                        </div>
                                        <Badge variant={overviewData.empresa.ambienteDgi === 'Producción' ? 'default' : 'secondary'}>
                                            {overviewData.empresa.ambienteDgi}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                                        <div>
                                            <p className="text-sm font-medium">Certificado Digital DGI</p>
                                            <p className="text-xs text-muted-foreground">Firma electrónica de documentos</p>
                                        </div>
                                        <Badge variant="success">
                                            {overviewData.empresa.certificadoDgi}
                                        </Badge>
                                    </div>

                                    {overviewData.billing && (
                                        <div className="space-y-2 p-4 rounded-lg border border-blue-100 bg-blue-50/50">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>Saldo de Folios FE</span>
                                                <span className="text-blue-700 font-bold">
                                                    {overviewData.billing.foliosRemaining} disponibles
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-full rounded-full transition-all"
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
                                        <CreditCard className="h-5 w-5 text-emerald-600" />
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
                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border rounded-lg bg-slate-50/50 border-dashed">
                                        <CheckCircle2 className="h-8 w-8 text-slate-400 mb-2" />
                                        <p className="text-sm font-medium text-slate-700">Sin cobros pendientes</p>
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
        </div>
    );
}
