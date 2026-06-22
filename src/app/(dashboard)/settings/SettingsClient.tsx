'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Settings as SettingsIcon,
    Building2,
    Key,
    Upload,
    CheckCircle2,
    XCircle,
    Loader2,
    Check,
    CreditCard,
    Sparkles,
    Zap,
    Building
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { updateDgiSettings, updateCompanyPlan } from '@/lib/actions/settings';

interface SettingsClientProps {
    initialCompany: {
        id: string;
        razonSocial: string;
        ruc: string;
        dv: string;
        direccion: string;
        ambienteDgi: string;
        certificadoDgi: string | null;
        usuarioPac: string;
        passwordPac: string;
        planType: string;
        fiscalEnabled: boolean;
        subscriptionStatus: string;
        createdAt: string;
        updatedAt: string;
    };
    invoicesCount: number;
    userRole: string;
}

export function SettingsClient({ initialCompany, invoicesCount, userRole }: SettingsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dgi' | 'users' | 'billing'>('dgi');
    const [company, setCompany] = useState(initialCompany);

    // DGI Form state
    const [razonSocial, setRazonSocial] = useState(company.razonSocial);
    const [ruc, setRuc] = useState(company.ruc);
    const [dv, setDv] = useState(company.dv);
    const [direccion, setDireccion] = useState(company.direccion);
    const [usuarioPac, setUsuarioPac] = useState(company.usuarioPac);
    const [passwordPac, setPasswordPac] = useState(company.passwordPac);
    const [ambienteDgi, setAmbienteDgi] = useState(company.ambienteDgi);
    const [certificado, setCertificado] = useState<File | null>(null);

    // Loading states
    const [estadoConexion, setEstadoConexion] = useState<'conectado' | 'desconectado' | 'probando'>('desconectado');
    const [isSaving, setIsSaving] = useState(false);
    const [isPlanLoading, setIsPlanLoading] = useState(false);

    // Billing state
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Document Limits & Display Info based on plan
    const getPlanLimitsInfo = (plan: string) => {
        switch (plan) {
            case 'basic':
                return { limit: 100, label: '100 docs/mes', desc: 'Tu plan Básico PAC te permite autorizar automáticamente hasta 100 facturas al mes con el PAC integrado.' };
            case 'pro':
                return { limit: 500, label: '500 docs/mes', desc: 'Tu plan Pro PAC te permite autorizar automáticamente hasta 500 facturas al mes con multiempresa y webhooks.' };
            case 'enterprise':
                return { limit: Infinity, label: 'Ilimitado', desc: 'Tu plan Enterprise Embedded te permite autorizar volumen a la medida con soporte prioritario y multi-PAC.' };
            case 'free':
            default:
                return { limit: 100, label: '100 docs/mes', desc: 'Tu plan Gratuito Asistido te permite preparar hasta 100 documentos al mes con autorización manual/asistida.' };
        }
    };

    const planInfo = getPlanLimitsInfo(company.planType);
    const currentLimit = planInfo.limit;
    const progressWidth = currentLimit === Infinity 
        ? 0 
        : Math.min((invoicesCount / currentLimit) * 100, 100);

    const handleSaveDgiSettings = async () => {
        setIsSaving(true);
        try {
            const result = await updateDgiSettings(company.id, {
                razonSocial,
                ruc,
                dv,
                direccion,
                usuarioPac,
                passwordPac,
                ambienteDgi
            });

            if (result.success) {
                toast.success(result.message);
                // Update local state and trigger refresh
                setCompany(prev => ({
                    ...prev,
                    razonSocial,
                    ruc,
                    dv,
                    direccion,
                    usuarioPac,
                    passwordPac,
                    ambienteDgi
                }));
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado al guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setEstadoConexion('probando');
        // Simulate PAC/DGI API connection test
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Validation logic
        if (!usuarioPac || !passwordPac) {
            setEstadoConexion('desconectado');
            toast.error('Debe completar el usuario y contraseña PAC para probar la conexión.');
            return;
        }

        const isSuccess = Math.random() > 0.15; // 85% success rate for test simulation
        setEstadoConexion(isSuccess ? 'conectado' : 'desconectado');
        if (isSuccess) {
            toast.success('Conexión con PAC y DGI establecida correctamente.');
        } else {
            toast.error('Error al conectar con el PAC. Verifique sus credenciales.');
        }
    };

    const handleUpdatePlan = async (newPlan: string) => {
        if (newPlan === 'enterprise') {
            toast.info('Para adquirir el plan Enterprise con facturación a la medida, por favor contacta a soporte.');
            return;
        }

        setIsPlanLoading(true);
        try {
            const result = await updateCompanyPlan(company.id, newPlan);
            if (result.success) {
                toast.success(result.message);
                setCompany(prev => ({
                    ...prev,
                    planType: newPlan,
                    fiscalEnabled: newPlan !== 'free',
                    // Auto reset environment to Test if plan changed to free
                    ambienteDgi: newPlan === 'free' ? '1' : prev.ambienteDgi
                }));
                if (newPlan === 'free') {
                    setAmbienteDgi('1');
                }
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al cambiar de plan.');
        } finally {
            setIsPlanLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCertificado(file);
            toast.success(`Certificado ${file.name} cargado temporalmente. Guarde cambios para aplicar.`);
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Gratuito Asistido',
            description: 'Para preparar y migrar tus datos con panel manual sin costo de PAC.',
            price: {
                monthly: 0,
                yearly: 0,
            },
            features: [
                'Hasta 100 documentos al mes (modo asistido)',
                '1 empresa, 1 usuario, clientes/productos',
                'Cotizaciones y prefacturas',
                'Exportación CSV/Excel, plantillas DGI',
                'Checklist de onboarding y alertas de certificado',
                'Panel de estatus manual (sin PAC automático)',
            ],
            cta: 'Plan Actual',
            highlight: false,
            variant: 'outline' as const,
        },
        {
            id: 'basic',
            name: 'Básico PAC',
            description: 'Conexión automática con PAC para pymes que inician.',
            price: {
                monthly: 9.90,
                yearly: 8.25, // $99/year
            },
            features: [
                'Hasta 100 documentos autorizados al mes',
                '1 empresa, 2 usuarios',
                'FE, NC, ND con CUFE/CAFE automáticos',
                'Envío por correo/WhatsApp y descarga XML/PDF',
                'Historial, dashboard simple, soporte 8x5',
                'Exceso a USD 0.07/documento (BYO PAC opcional)',
            ],
            cta: 'Actualizar a Básico',
            highlight: false,
            variant: 'outline' as const,
        },
        {
            id: 'pro',
            name: 'Pro PAC',
            description: 'Para empresas en crecimiento que facturan de forma avanzada.',
            price: {
                monthly: 19.90,
                yearly: 16.58, // $199/year
            },
            features: [
                'Hasta 500 documentos autorizados al mes',
                '3 empresas, 5 usuarios',
                'FE, NC, ND, sucursales y POS ligero',
                'Exportación contable, conciliación por estados',
                'Webhook/API entrante, contingencia, roles',
                'Exceso a USD 0.04/documento (soporte contador)',
            ],
            cta: 'Actualizar a Pro',
            highlight: true,
            variant: 'default' as const,
        },
        {
            id: 'enterprise',
            name: 'Enterprise Embedded',
            description: 'Solución corporativa para integraciones y alto volumen.',
            price: {
                monthly: 79,
                yearly: 65.83, // $790/year
            },
            features: [
                'Facturas y documentos con volumen a la medida',
                'Multiempresa avanzada y multiusuario granular',
                'SSO, SLA, soporte prioritario 24/7',
                'Ambientes dev/test/prod y webhooks salientes',
                'Marca blanca (white-label) y auditoría completa',
                'Redundancia dual-PAC failover y onboarding dedicado',
            ],
            cta: 'Actualizar a Enterprise',
            highlight: false,
            variant: 'outline' as const,
        },
    ];

    return (
        <>
            <Topbar title="Configuración" />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                        <p className="text-muted-foreground">
                            Administra la configuración de tu empresa, usuarios y planes de facturación fiscal.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b">
                        <button
                            onClick={() => setActiveTab('dgi')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dgi'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Integración DGI
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Gestión de Usuarios
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'billing'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Planes y Facturación
                            </div>
                        </button>
                    </div>

                    {/* DGI Configuration Tab */}
                    {activeTab === 'dgi' && (
                        <div className="space-y-6">
                            {/* Info Banner */}
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <SettingsIcon className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-primary">Configuración de Facturación Electrónica</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Configure sus credenciales PAC y certificado digital para habilitar el timbrado de facturas.
                                                El ambiente de Producción requiere un plan de pago.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Section 1: Datos del Contribuyente */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            1. Datos del Contribuyente
                                        </CardTitle>
                                        <CardDescription>
                                            Información fiscal de tu empresa
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Razón Social
                                            </label>
                                            <Input
                                                placeholder="Mi Empresa, S.A."
                                                value={razonSocial}
                                                onChange={(e) => setRazonSocial(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    RUC
                                                </label>
                                                <Input
                                                    placeholder="155-123-456789"
                                                    value={ruc}
                                                    onChange={(e) => setRuc(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    DV
                                                </label>
                                                <Input
                                                    placeholder="12"
                                                    value={dv}
                                                    onChange={(e) => setDv(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Dirección de Sucursal
                                            </label>
                                            <Input
                                                placeholder="Calle Principal, Ciudad de Panamá"
                                                value={direccion}
                                                onChange={(e) => setDireccion(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Ambiente de Integración DGI
                                            </label>
                                            <select
                                                value={ambienteDgi}
                                                onChange={(e) => setAmbienteDgi(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="1">Ambiente de Pruebas (Piloto)</option>
                                                <option value="2" disabled={company.planType === 'free'}>
                                                    Ambiente de Producción (Oficial) {company.planType === 'free' ? '— Requiere Plan Pro/Enterprise' : ''}
                                                </option>
                                            </select>
                                            {company.planType === 'free' && (
                                                <p className="text-xs text-amber-600 font-medium mt-1">
                                                    * Para habilitar producción debes actualizar tu plan de pruebas actual.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Section 2: Credenciales del PAC */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Key className="h-5 w-5 text-primary" />
                                            2. Credenciales del PAC
                                        </CardTitle>
                                        <CardDescription>
                                            Credenciales para comunicarse con la DGI
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Certificate Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Certificado Digital (.p12)
                                            </label>
                                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {certificado ? certificado.name : company.certificadoDgi ? 'certificado_dgi_guardado.p12' : 'Arrastra o selecciona tu certificado'}
                                                </p>
                                                <Button variant="outline" size="sm" asChild>
                                                    <label className="cursor-pointer">
                                                        Seleccionar Archivo
                                                        <input
                                                            type="file"
                                                            accept=".p12,.pfx"
                                                            className="hidden"
                                                            onChange={handleFileChange}
                                                        />
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Usuario PAC
                                            </label>
                                            <Input
                                                placeholder="usuario@pac.com"
                                                value={usuarioPac}
                                                onChange={(e) => setUsuarioPac(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Contraseña PAC
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordPac}
                                                onChange={(e) => setPasswordPac(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Connection Status & Actions */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-muted-foreground">Estado de Conexión:</span>
                                            {estadoConexion === 'conectado' && (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                    Conectado
                                                </Badge>
                                            )}
                                            {estadoConexion === 'desconectado' && (
                                                <Badge variant="secondary" className="bg-gray-500 text-white hover:bg-gray-500">
                                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                                    Desconectado
                                                </Badge>
                                            )}
                                            {estadoConexion === 'probando' && (
                                                <Badge variant="secondary">
                                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                    Probando...
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={handleSaveDgiSettings} disabled={isSaving}>
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Guardando...
                                                    </>
                                                ) : (
                                                    'Guardar Borrador'
                                                )}
                                            </Button>
                                            <Button
                                                onClick={handleTestConnection}
                                                disabled={estadoConexion === 'probando'}
                                            >
                                                <Key className="h-4 w-4 mr-2" />
                                                Probar Conexión DGI
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Gestión de Usuarios</CardTitle>
                                <CardDescription>
                                    Próximamente: Administra los usuarios y permisos de tu empresa
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Esta funcionalidad estará disponible próximamente.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            {/* Current Status Banner */}
                            <Card className="border-indigo-100 bg-indigo-50/30">
                                <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                                            {company.planType === 'free' && <Sparkles className="h-6 w-6" />}
                                            {company.planType === 'basic' && <Zap className="h-6 w-6" />}
                                            {company.planType === 'pro' && <Zap className="h-6 w-6 animate-pulse text-amber-500" />}
                                            {company.planType === 'enterprise' && <Building className="h-6 w-6 text-indigo-600" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg text-indigo-950">
                                                    Plan Actual: {company.planType === 'free' ? 'Gratuito Asistido' : company.planType === 'basic' ? 'Básico PAC' : company.planType === 'pro' ? 'Pro PAC' : 'Enterprise Embedded'}
                                                </h3>
                                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200 uppercase text-[10px]">
                                                    {company.subscriptionStatus === 'active' ? 'Activo' : company.subscriptionStatus}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-indigo-900/80 mt-1">
                                                {planInfo.desc}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <div className="text-xs text-indigo-900/60 mb-2">Consumo de documentos:</div>
                                        <div className="w-full sm:w-48 bg-indigo-100 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${progressWidth}%` }} 
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-indigo-900/70 mt-1">
                                            <span>{invoicesCount} generados</span>
                                            <span>{planInfo.label}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pricing Cycle Selector */}
                            <div className="flex flex-col items-center gap-4 mb-6">
                                <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                            billingCycle === 'monthly'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        Facturación Mensual
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                                            billingCycle === 'yearly'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>Facturación Anual</span>
                                        <Badge className="bg-indigo-100 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-700 border-none px-1.5 py-0 text-[10px] font-bold">
                                            Ahorra 17%
                                        </Badge>
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {billingCycle === 'yearly'
                                        ? 'Los planes anuales se facturan en un solo pago anual.'
                                        : 'Precios en dólares americanos (USD). Cancela o cambia en cualquier momento.'}
                                </p>
                            </div>

                            {/* Plan Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-6">
                                {plans.map((plan) => {
                                    const isCurrent = plan.id === company.planType;
                                    const isCustomPrice = typeof plan.price.monthly === 'string';
                                    const price = isCustomPrice 
                                        ? 'Personalizado' 
                                        : (billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly);

                                    return (
                                        <Card
                                            key={plan.id}
                                            className={`flex flex-col h-full relative transition-all duration-300 hover:shadow-lg ${
                                                plan.highlight
                                                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10 scale-100 md:scale-[1.02]'
                                                     : 'border-border'
                                            }`}
                                        >
                                            {plan.highlight && (
                                                 <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
                                                     <Zap className="h-3 w-3 fill-white" />
                                                     Más Popular
                                                 </span>
                                            )}

                                             <CardHeader className="pb-6">
                                                 <CardTitle className="text-2xl font-bold flex items-center justify-between">
                                                     <span>{plan.name}</span>
                                                     {plan.id === 'free' && <Sparkles className="h-5 w-5 text-indigo-500" />}
                                                     {plan.id === 'basic' && <Zap className="h-5 w-5 text-indigo-500" />}
                                                     {plan.id === 'pro' && <Zap className="h-5 w-5 text-amber-500" />}
                                                     {plan.id === 'enterprise' && <Building className="h-5 w-5 text-slate-500" />}
                                                 </CardTitle>
                                                <CardDescription className="min-h-[40px] mt-2">
                                                    {plan.description}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="flex-1 flex flex-col pt-0">
                                                {/* Price Section */}
                                                <div className="mb-6">
                                                    {isCustomPrice ? (
                                                        <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                                                            {price}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                                                                ${price}
                                                            </span>
                                                            <span className="text-muted-foreground ml-1 text-sm font-medium">/ mes</span>
                                                        </>
                                                    )}
                                                    {billingCycle === 'yearly' && !isCustomPrice && (price as number) > 0 && (
                                                        <div className="text-xs text-indigo-600 font-semibold mt-1">
                                                            Cobrado anualmente (${(price as number) * 12}/año)
                                                        </div>
                                                    )}
                                                </div>

                                                <Separator className="mb-6" />

                                                {/* Features List */}
                                                <ul className="space-y-3.5 flex-1 mb-8 text-sm text-slate-600">
                                                    {plan.features.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-2.5">
                                                            <div className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                                                                plan.highlight
                                                                    ? 'bg-indigo-100 text-indigo-700'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                <Check className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {/* CTA Button */}
                                                <Button
                                                    className={`w-full py-5 text-sm font-semibold transition-all ${
                                                        isCurrent
                                                            ? 'bg-slate-100 text-slate-600 border-none cursor-default hover:bg-slate-100'
                                                            : plan.highlight
                                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                                                                : 'border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50/50'
                                                    }`}
                                                    variant={plan.variant}
                                                    disabled={isCurrent || isPlanLoading}
                                                    onClick={() => handleUpdatePlan(plan.id)}
                                                >
                                                    {isPlanLoading && !isCurrent ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Actualizando...
                                                        </>
                                                    ) : isCurrent ? (
                                                        'Tu Plan Actual'
                                                    ) : (
                                                        plan.cta
                                                    )}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Help / Payment Security Section */}
                            <Card className="border-slate-100 bg-slate-50/30">
                                <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-8">
                                    <div className="flex items-center gap-4">
                                        <CreditCard className="h-8 w-8 text-slate-500 shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">¿Tienes dudas sobre los planes o facturación?</h4>
                                            <p className="text-sm text-muted-foreground">Estamos aquí para ayudarte a elegir el plan perfecto para cumplir con los requerimientos fiscales de la DGI.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="shrink-0 border-slate-300 hover:bg-slate-100">
                                        Contactar Asesor
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </ContentContainer>
        </>
    );
}
