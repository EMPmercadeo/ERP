'use client';

import { useState, useEffect } from 'react';
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
    Building,
    X
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { updateDgiSettings, updateCompanyPlan, updateIntegrationSettings } from '@/lib/actions/settings';
import { purchaseDocumentBlock } from '@/lib/actions/billing';
import { getPOSIntegrations, connectPOS, disconnectPOS, syncPOSProducts, syncPOSSales, syncPOSInventory } from '@/lib/actions/pos';

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
        hasPacPassword?: boolean;
        planType: string;
        fiscalEnabled: boolean;
        subscriptionStatus: string;
        createdAt: string;
        updatedAt: string;
        whatsappPhone?: string;
        whatsappToken?: string;
        webhookUrl?: string;
        webhookToken?: string;
    };
    invoicesCount: number;
    initialDocumentUsage: {
        usedDocuments: number;
        includedLimit: number;
        extraDocumentsPurchased: number;
        remainingDocuments: number;
    };
    userRole: string;
}

export function SettingsClient({ initialCompany, invoicesCount, initialDocumentUsage, userRole }: SettingsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dgi' | 'users' | 'billing' | 'integrations'>('dgi');
    const [company, setCompany] = useState(initialCompany);
    const [documentUsage, setDocumentUsage] = useState(initialDocumentUsage);

    // DGI Form state
    const [razonSocial, setRazonSocial] = useState(company.razonSocial);
    const [ruc, setRuc] = useState(company.ruc);
    const [dv, setDv] = useState(company.dv);
    const [direccion, setDireccion] = useState(company.direccion);
    const [usuarioPac, setUsuarioPac] = useState(company.usuarioPac);
    const [passwordPac, setPasswordPac] = useState(company.passwordPac);
    const [ambienteDgi, setAmbienteDgi] = useState(company.ambienteDgi);
    const [certificado, setCertificado] = useState<File | null>(null);

    // Integrations state
    const [whatsappPhone, setWhatsappPhone] = useState(company.whatsappPhone || '');
    const [whatsappToken, setWhatsappToken] = useState(company.whatsappToken || '');
    const [webhookUrl, setWebhookUrl] = useState(company.webhookUrl || '');
    const [webhookToken, setWebhookToken] = useState(company.webhookToken || '');

    // Loading states
    const [estadoConexion, setEstadoConexion] = useState<'conectado' | 'desconectado' | 'probando'>('desconectado');
    const [isSaving, setIsSaving] = useState(false);
    const [isPlanLoading, setIsPlanLoading] = useState(false);
    const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);

    // Billing state
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Subscription payment simulation states
    const [showPaypalModal, setShowPaypalModal] = useState(false);
    const [selectedPlanForPay, setSelectedPlanForPay] = useState<any>(null);
    const [paymentStep, setPaymentStep] = useState<'details' | 'simulating' | 'success'>('details');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isPaypalSdkLoaded, setIsPaypalSdkLoaded] = useState(false);
    const [showPurchaseBlockModal, setShowPurchaseBlockModal] = useState(false);
    const [selectedBlockSize, setSelectedBlockSize] = useState<number>(100);
    const [isPurchasingBlock, setIsPurchasingBlock] = useState(false);

    // POS States
    const [posIntegrations, setPosIntegrations] = useState<any[]>([]);
    const [isLoadingPos, setIsLoadingPos] = useState(false);
    const [posProvider, setPosProvider] = useState<string>('loyverse');
    const [posApiKey, setPosApiKey] = useState('');
    const [posApiSecret, setPosApiSecret] = useState('');
    const [posAccessToken, setPosAccessToken] = useState('');
    const [posRefreshToken, setPosRefreshToken] = useState('');
    const [posSyncProducts, setPosSyncProducts] = useState(true);
    const [posSyncSales, setPosSyncSales] = useState(true);
    const [posSyncInventory, setPosSyncInventory] = useState(true);
    const [isConnectingPos, setIsConnectingPos] = useState(false);
    const [isSyncingPos, setIsSyncingPos] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (activeTab === 'integrations') {
            setIsLoadingPos(true);
            getPOSIntegrations().then(data => {
                setPosIntegrations(data || []);
                setIsLoadingPos(false);
            });
        }
    }, [activeTab]);

    useEffect(() => {
        if (!showPaypalModal || !selectedPlanForPay) return;

        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) {
            console.log("No PayPal Client ID configured, using simulation mode.");
            return;
        }

        const planId = selectedPlanForPay.id === 'basic'
            ? process.env.NEXT_PUBLIC_PLAN_BASIC_ID || process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC_ID
            : process.env.NEXT_PUBLIC_PLAN_PRO_ID || process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO_ID;

        if (!planId) {
            console.error(`No Plan ID configured for plan type: ${selectedPlanForPay.id}`);
            return;
        }

        // Load PayPal SDK script
        const scriptId = 'paypal-sdk-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initButtons = () => {
            if (!(window as any).paypal) return;
            setIsPaypalSdkLoaded(true);
            
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = '';
            } else {
                return;
            }

            (window as any).paypal.Buttons({
                style: {
                    shape: 'pill',
                    color: 'gold',
                    layout: 'vertical',
                    label: 'subscribe'
                },
                createSubscription: function(data: any, actions: any) {
                    return actions.subscription.create({
                        plan_id: planId,
                        custom_id: company.id
                    });
                },
                onApprove: async function(data: any, actions: any) {
                    setPaymentStep('simulating');
                    try {
                        setIsPlanLoading(true);
                        const result = await updateCompanyPlan(company.id, selectedPlanForPay.id);
                        if (result.success) {
                            setCompany(prev => ({
                                ...prev,
                                planType: selectedPlanForPay.id,
                                fiscalEnabled: selectedPlanForPay.id !== 'free',
                                subscriptionStatus: 'active'
                            }));
                            setPaymentStep('success');
                            toast.success(`¡Suscripción al plan ${selectedPlanForPay.name} activada con éxito!`);
                            router.refresh();
                        } else {
                            toast.error(result.message);
                            setPaymentStep('details');
                        }
                    } catch (error) {
                        toast.error('Error al actualizar el plan.');
                        setPaymentStep('details');
                    } finally {
                        setIsPlanLoading(false);
                    }
                },
                onError: function(err: any) {
                    console.error('PayPal Checkout error:', err);
                    toast.error('Error al procesar la suscripción con PayPal.');
                }
            }).render('#paypal-button-container');
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
            script.async = true;
            script.onload = () => {
                initButtons();
            };
            document.body.appendChild(script);
        } else {
            setTimeout(initButtons, 100);
        }
    }, [showPaypalModal, selectedPlanForPay, company.id, router]);


    // Document Limits & Display Info based on plan
    const getPlanLimitsInfo = (plan: string) => {
        switch (plan) {
            case 'emprendedor':
                return { limit: 150, label: '150 docs/mes', desc: 'Tu plan Emprendedor te permite autorizar de forma automatizada hasta 150 documentos electrónicos al mes.' };
            case 'negocio':
                return { limit: 300, label: '300 docs/mes', desc: 'Tu plan Negocio te permite autorizar de forma automatizada hasta 300 documentos electrónicos al mes.' };
            case 'pro':
                return { limit: 600, label: '600 docs/mes', desc: 'Tu plan Pro te permite autorizar de forma automatizada hasta 600 documentos electrónicos al mes.' };
            case 'empresa':
                return { limit: 1000, label: '1,000 docs/mes', desc: 'Tu plan Empresa te permite autorizar de forma automatizada hasta 1,000 documentos electrónicos al mes.' };
            case 'free':
            default:
                return { limit: 10, label: '10 docs/mes', desc: 'Tu plan de Sandbox de pruebas te permite emitir hasta 10 documentos de simulación al mes.' };
        }
    };

    const planInfo = getPlanLimitsInfo(company.planType);
    const totalCapacity = documentUsage.includedLimit + documentUsage.extraDocumentsPurchased;
    const progressWidth = totalCapacity === 0 ? 0 : Math.min((documentUsage.usedDocuments / totalCapacity) * 100, 100);

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

    const handleSaveIntegrationSettings = async () => {
        setIsSavingIntegrations(true);
        try {
            const result = await updateIntegrationSettings(company.id, {
                whatsappPhone,
                whatsappToken,
                webhookUrl,
                webhookToken
            });

            if (result.success) {
                toast.success(result.message);
                setCompany(prev => ({
                    ...prev,
                    whatsappPhone,
                    whatsappToken,
                    webhookUrl,
                    webhookToken
                }));
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al guardar las integraciones.');
        } finally {
            setIsSavingIntegrations(false);
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

    const handleConnectPOS = async () => {
        setIsConnectingPos(true);
        try {
            const res = await connectPOS(posProvider, {
                apiKey: posApiKey,
                apiSecret: posApiSecret,
                accessToken: posAccessToken,
                refreshToken: posRefreshToken,
                syncProducts: posSyncProducts,
                syncSales: posSyncSales,
                syncInventory: posSyncInventory
            });

            if (res.success) {
                toast.success(res.message);
                setPosApiKey('');
                setPosApiSecret('');
                setPosAccessToken('');
                setPosRefreshToken('');
                
                const data = await getPOSIntegrations();
                setPosIntegrations(data || []);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Error al conectar POS.');
        } finally {
            setIsConnectingPos(false);
        }
    };

    const handleDisconnectPOS = async (providerSlug: string) => {
        try {
            const res = await disconnectPOS(providerSlug);
            if (res.success) {
                toast.success(res.message);
                const data = await getPOSIntegrations();
                setPosIntegrations(data || []);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Error al desconectar POS.');
        }
    };

    const handleSyncPOS = async (providerSlug: string, type: 'products' | 'sales' | 'inventory') => {
        setIsSyncingPos(prev => ({ ...prev, [`${providerSlug}_${type}`]: true }));
        try {
            let res;
            if (type === 'products') res = await syncPOSProducts(providerSlug);
            else if (type === 'sales') res = await syncPOSSales(providerSlug);
            else res = await syncPOSInventory(providerSlug);

            if (res.success) {
                toast.success(res.message);
                const data = await getPOSIntegrations();
                setPosIntegrations(data || []);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error(`Error al sincronizar ${type}.`);
        } finally {
            setIsSyncingPos(prev => ({ ...prev, [`${providerSlug}_${type}`]: false }));
        }
    };

    const handleUpdatePlan = async (newPlan: string) => {
        if (newPlan === 'enterprise') {
            toast.info('Para adquirir el plan Enterprise con facturación a la medida, por favor contacta a soporte.');
            return;
        }

        const planObj = plans.find(p => p.id === newPlan);
        if (planObj) {
            setSelectedPlanForPay(planObj);
            setPaymentStep('details');
            setShowPaypalModal(true);
        }
    };

    const executePayment = async () => {
        if (!selectedPlanForPay) return;
        setPaymentStep('simulating');
        
        try {
            // Simulate connecting with PayPal and vaulting payment token
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setIsPlanLoading(true);
            const result = await updateCompanyPlan(company.id, selectedPlanForPay.id);
            if (result.success) {
                setCompany(prev => ({
                    ...prev,
                    planType: selectedPlanForPay.id,
                    fiscalEnabled: selectedPlanForPay.id !== 'free',
                    subscriptionStatus: 'active'
                }));
                setPaymentStep('success');
                toast.success(`¡Suscripción al plan ${selectedPlanForPay.name} activada con éxito!`);
                router.refresh();
            } else {
                toast.error(result.message);
                setPaymentStep('details');
            }
        } catch (error) {
            toast.error('Error al procesar la suscripción con PayPal.');
            setPaymentStep('details');
        } finally {
            setIsPlanLoading(false);
        }
    };

    const executeCancelSubscription = async () => {
        setIsPlanLoading(true);
        try {
            const result = await updateCompanyPlan(company.id, 'free');
            if (result.success) {
                setCompany(prev => ({
                    ...prev,
                    planType: 'free',
                    fiscalEnabled: false,
                    subscriptionStatus: 'active'
                }));
                setShowCancelModal(false);
                toast.success('Tu suscripción ha sido cancelada. Tu cuenta ahora está en el plan Gratuito.');
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al cancelar la suscripción.');
        } finally {
            setIsPlanLoading(false);
        }
    };

    const handlePurchaseBlock = async () => {
        setIsPurchasingBlock(true);
        try {
            const res = await purchaseDocumentBlock(company.id, selectedBlockSize);
            if (res.success) {
                toast.success(res.message);
                setDocumentUsage(prev => {
                    const nextExtra = prev.extraDocumentsPurchased + selectedBlockSize;
                    const nextRemaining = (prev.includedLimit + nextExtra) - prev.usedDocuments;
                    return {
                        ...prev,
                        extraDocumentsPurchased: nextExtra,
                        remainingDocuments: nextRemaining
                    };
                });
                setShowPurchaseBlockModal(false);
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Error al procesar la compra del bloque de documentos.');
        } finally {
            setIsPurchasingBlock(false);
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
            id: 'emprendedor',
            name: 'Plan Emprendedor',
            description: 'Ideal para independientes y emprendedores que inician.',
            price: {
                monthly: 19.99,
                yearly: 16.58, // $199/year
            },
            features: [
                '150 documentos electrónicos al mes',
                '1 usuario incluido',
                'Clientes, productos y servicios',
                'Cotizaciones',
                'Facturas electrónicas',
                'Descarga PDF/XML',
                'Cuentas por cobrar',
                'Reportes básicos',
                'Envío por correo o WhatsApp'
            ],
            cta: 'Actualizar a Emprendedor',
            highlight: false,
            variant: 'outline' as const,
        },
        {
            id: 'negocio',
            name: 'Plan Negocio',
            description: 'Para pequeños negocios con necesidades estándar.',
            price: {
                monthly: 34.99,
                yearly: 29.08, // $349/year
            },
            features: [
                'Todo lo del plan Emprendedor',
                '300 documentos electrónicos al mes',
                '2 usuarios incluidos',
                'Inventario básico',
                'Notas de crédito y débito',
                'Reportes de ventas',
                'Control de pagos',
                'Dashboard mensual',
                'Integración POS básica'
            ],
            cta: 'Actualizar a Negocio',
            highlight: false,
            variant: 'outline' as const,
        },
        {
            id: 'pro',
            name: 'Plan Pro',
            description: 'Para empresas medianas en crecimiento constante.',
            price: {
                monthly: 54.99,
                yearly: 45.75, // $549/year
            },
            features: [
                'Todo lo del plan Negocio',
                '600 documentos electrónicos al mes',
                '5 usuarios incluidos',
                'Permisos por usuario (roles)',
                'Sucursales y cajas',
                'Reportes avanzados',
                'Exportación contable',
                'Automatizaciones básicas',
                'Soporte POS avanzado'
            ],
            cta: 'Actualizar a Pro',
            highlight: true,
            variant: 'default' as const,
        },
        {
            id: 'empresa',
            name: 'Plan Empresa',
            description: 'Para corporaciones y operaciones a gran escala.',
            price: {
                monthly: 89.99,
                yearly: 74.92, // $899/year
            },
            features: [
                'Todo lo del plan Pro',
                '1,000 documentos electrónicos al mes',
                '10 usuarios incluidos',
                'Soporte prioritario',
                'API y Webhooks salientes',
                'Integraciones y configuración asistida',
                'Multiempresa y multisucursal avanzada'
            ],
            cta: 'Actualizar a Empresa',
            highlight: false,
            variant: 'outline' as const,
        }
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
                        <button
                            onClick={() => setActiveTab('integrations')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'integrations'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                WhatsApp y APIs
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
                                                placeholder={company.hasPacPassword ? "•••••••• (Configurada)" : "••••••••"}
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
                                            {company.planType === 'emprendedor' && <Zap className="h-6 w-6" />}
                                            {company.planType === 'negocio' && <Zap className="h-6 w-6 text-indigo-600" />}
                                            {company.planType === 'pro' && <Zap className="h-6 w-6 animate-pulse text-amber-500" />}
                                            {company.planType === 'empresa' && <Building className="h-6 w-6 text-indigo-600" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg text-indigo-950">
                                                    Plan Actual: {company.planType === 'free' ? 'Plan de Pruebas' : company.planType === 'emprendedor' ? 'Plan Emprendedor' : company.planType === 'negocio' ? 'Plan Negocio' : company.planType === 'pro' ? 'Plan Pro' : 'Plan Empresa'}
                                                </h3>
                                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200 uppercase text-[10px]">
                                                    {company.subscriptionStatus === 'active' ? 'Activo' : company.subscriptionStatus}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-indigo-900/80 mt-1">
                                                {planInfo.desc}
                                            </p>
                                            {company.planType !== 'free' && (
                                                <div className="mt-2.5 flex items-center gap-4">
                                                    <span className="text-xs text-indigo-950/60 font-semibold flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                        Renovación PayPal activa
                                                    </span>
                                                    <button
                                                        onClick={() => setShowCancelModal(true)}
                                                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                                                    >
                                                        Cancelar Suscripción
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                                        <div className="w-full">
                                            <div className="flex justify-between text-xs text-indigo-900/60 mb-1.5">
                                                <span>Consumo de documentos:</span>
                                                <span className="font-bold">{documentUsage.usedDocuments} / {totalCapacity}</span>
                                            </div>
                                            <div className="w-full sm:w-48 bg-indigo-100 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                                                    style={{ width: `${progressWidth}%` }} 
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-indigo-900/70 mt-1">
                                                <span>{documentUsage.usedDocuments} generados</span>
                                                <span>{documentUsage.extraDocumentsPurchased > 0 ? `${documentUsage.includedLimit} incl. + ${documentUsage.extraDocumentsPurchased} extras` : `${documentUsage.includedLimit} incl.`}</span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 px-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                            onClick={() => setShowPurchaseBlockModal(true)}
                                        >
                                            Comprar Bloque
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

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

                            {/* Legal/Commercial Text Notice */}
                            <div className="text-center text-xs text-muted-foreground max-w-3xl mx-auto my-4 leading-relaxed font-sans">
                                * Los documentos electrónicos incluidos están sujetos a disponibilidad, validación y condiciones del proveedor PAC autorizado. Los documentos adicionales pueden adquirirse por consumo. No existe emisión ilimitada.
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

                    {/* Integrations Tab */}
                    {activeTab === 'integrations' && (
                        <div className="space-y-6">
                            {/* Info Banner */}
                            <Card className="border-indigo-200 bg-indigo-50/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-indigo-950">WhatsApp API y Webhooks de Integración</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Configura el envío automático de facturas por WhatsApp y la recepción de eventos en tiempo real mediante Webhooks.
                                                Estas características requieren un plan de pago habilitado.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* WhatsApp Config Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-indigo-600" />
                                            Configuración de WhatsApp API
                                        </CardTitle>
                                        <CardDescription>
                                            Permite enviar el PDF y XML de la factura directo al WhatsApp del cliente
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Teléfono Emisor de WhatsApp
                                            </label>
                                            <Input
                                                placeholder="+507 6000-0000"
                                                value={whatsappPhone}
                                                onChange={(e) => setWhatsappPhone(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Número configurado en tu cuenta de WhatsApp Business Cloud API.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                API Token / Access Token
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="Token de acceso permanente de Meta"
                                                value={whatsappToken}
                                                onChange={(e) => setWhatsappToken(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Se utiliza para autenticar los mensajes enviados mediante Meta Graph API.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Webhook Config Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building className="h-5 w-5 text-indigo-600" />
                                            Webhooks y API Web Saliente
                                        </CardTitle>
                                        <CardDescription>
                                            Envía notificaciones de eventos (Factura Autorizada, Anulada) a tus sistemas externos
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                URL de Destino del Webhook
                                            </label>
                                            <Input
                                                placeholder="https://tu-sistema.com/api/webhooks/factura"
                                                value={webhookUrl}
                                                onChange={(e) => setWebhookUrl(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Endpoint que recibirá los payloads JSON del estado de facturas.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Firma Secreta del Webhook (Token)
                                            </label>
                                            <Input
                                                type="password"
                                                placeholder="Clave de seguridad para verificar autenticidad"
                                                value={webhookToken}
                                                onChange={(e) => setWebhookToken(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Enviado en la cabecera `X-Webhook-Signature` para asegurar el origen.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Actions */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={handleSaveIntegrationSettings}
                                            disabled={isSavingIntegrations}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {isSavingIntegrations ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                'Guardar Integraciones'
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* POS Integrations */}
                            <Card className="mt-8">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-indigo-600" />
                                        Conexión POS (Puntos de Venta)
                                    </CardTitle>
                                    <CardDescription>
                                        Conecta y sincroniza ERP Panamá con tus sistemas de punto de venta externos o propios.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {company.planType === 'free' || company.planType === 'emprendedor' ? (
                                        <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/20 p-8 text-center max-w-xl mx-auto space-y-4">
                                            <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-base font-bold text-indigo-950">Módulo de Sincronización POS Bloqueado</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Esta función te permite conectar con Loyverse, Square, Shopify POS y WooCommerce POS para importar ventas y facturar automáticamente. Está disponible desde el plan **Negocio**.
                                                </p>
                                            </div>
                                            <Button 
                                                onClick={() => setActiveTab('billing')}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                                            >
                                                Subir de Plan
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-8 lg:grid-cols-2">
                                            {/* Left: Connect Form */}
                                            <div className="space-y-4 border-r pr-0 lg:pr-8 border-border">
                                                <h4 className="text-sm font-bold text-slate-800">Conectar Nuevo POS</h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Proveedor POS</label>
                                                        <select
                                                            value={posProvider}
                                                            onChange={(e) => setPosProvider(e.target.value)}
                                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                        >
                                                            <option value="loyverse">Loyverse POS</option>
                                                            <option value="square">Square POS</option>
                                                            <option value="shopify_pos">Shopify POS</option>
                                                            <option value="woocommerce_pos">WooCommerce POS</option>
                                                            <option value="custom_api">Custom API POS</option>
                                                            <option value="manual_pos">Manual POS (Simulador)</option>
                                                        </select>
                                                    </div>

                                                    {(posProvider !== 'manual_pos') && (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">API Key / Client ID</label>
                                                                <Input 
                                                                    placeholder="Ingresa la llave de API"
                                                                    value={posApiKey}
                                                                    onChange={(e) => setPosApiKey(e.target.value)}
                                                                    className="text-xs"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">API Secret / Client Secret</label>
                                                                <Input 
                                                                    type="password"
                                                                    placeholder="Ingresa la clave secreta de API"
                                                                    value={posApiSecret}
                                                                    onChange={(e) => setPosApiSecret(e.target.value)}
                                                                    className="text-xs"
                                                                />
                                                            </div>
                                                            {(posProvider === 'square' || posProvider === 'shopify_pos') && (
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Access Token</label>
                                                                    <Input 
                                                                        type="password"
                                                                        placeholder="Ingresa el token de acceso"
                                                                        value={posAccessToken}
                                                                        onChange={(e) => setPosAccessToken(e.target.value)}
                                                                        className="text-xs"
                                                                    />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    <div className="space-y-2 pt-2">
                                                        <label className="block text-xs font-semibold text-muted-foreground">Opciones de Sincronización</label>
                                                        <div className="flex flex-wrap gap-4 text-xs">
                                                            <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={posSyncProducts}
                                                                    onChange={(e) => setPosSyncProducts(e.target.checked)}
                                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-1"
                                                                />
                                                                Productos
                                                            </label>
                                                            <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={posSyncSales}
                                                                    onChange={(e) => setPosSyncSales(e.target.checked)}
                                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-1"
                                                                />
                                                                Ventas
                                                            </label>
                                                            <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={posSyncInventory}
                                                                    onChange={(e) => setPosSyncInventory(e.target.checked)}
                                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-1"
                                                                />
                                                                Inventario
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={handleConnectPOS}
                                                        disabled={isConnectingPos}
                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs mt-4"
                                                    >
                                                        {isConnectingPos ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Conectando...
                                                            </>
                                                        ) : (
                                                            'Conectar POS'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Right: Active Status & Logs */}
                                            <div className="space-y-6">
                                                <h4 className="text-sm font-bold text-slate-800">POS Conectados</h4>
                                                
                                                {posIntegrations.length === 0 ? (
                                                    <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground text-xs">
                                                        No hay integraciones POS activas configuradas.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {posIntegrations.map((integration) => (
                                                            <div key={integration.id} className="border rounded-lg p-4 bg-slate-50/50 space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <div className="font-bold text-xs text-slate-900">{integration.providerName}</div>
                                                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                            Última Sincronización: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString('es-PA') : 'Nunca'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className={
                                                                            integration.status === 'active' ? "bg-emerald-500 text-white font-bold border-none" : 
                                                                            integration.status === 'error' ? "bg-rose-500 text-white font-bold border-none" : 
                                                                            "bg-slate-300 text-slate-700 font-bold border-none"
                                                                        }>
                                                                            {integration.status === 'active' ? 'Conectado' : integration.status}
                                                                        </Badge>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            onClick={() => handleDisconnectPOS(integration.providerSlug)}
                                                                            className="text-xs h-7 text-rose-600 hover:bg-rose-50 font-bold"
                                                                        >
                                                                            Desconectar
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    {integration.syncProductsEnabled && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            disabled={isSyncingPos[`${integration.providerSlug}_products`]}
                                                                            onClick={() => handleSyncPOS(integration.providerSlug, 'products')}
                                                                            className="text-[10px] h-7 flex-1 border-indigo-100 text-indigo-700"
                                                                        >
                                                                            {isSyncingPos[`${integration.providerSlug}_products`] ? 'Sincronizando...' : 'Sinc. Productos'}
                                                                        </Button>
                                                                    )}
                                                                    {integration.syncSalesEnabled && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            disabled={isSyncingPos[`${integration.providerSlug}_sales`]}
                                                                            onClick={() => handleSyncPOS(integration.providerSlug, 'sales')}
                                                                            className="text-[10px] h-7 flex-1 border-indigo-100 text-indigo-700"
                                                                        >
                                                                            {isSyncingPos[`${integration.providerSlug}_sales`] ? 'Sincronizando...' : 'Sinc. Ventas'}
                                                                        </Button>
                                                                    )}
                                                                    {integration.syncInventoryEnabled && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            disabled={isSyncingPos[`${integration.providerSlug}_inventory`]}
                                                                            onClick={() => handleSyncPOS(integration.providerSlug, 'inventory')}
                                                                            className="text-[10px] h-7 flex-1 border-indigo-100 text-indigo-700"
                                                                        >
                                                                            {isSyncingPos[`${integration.providerSlug}_inventory`] ? 'Sincronizando...' : 'Sinc. Inventario'}
                                                                        </Button>
                                                                    )}
                                                                </div>

                                                                {/* Logs list */}
                                                                <div className="space-y-1.5 pt-2 border-t">
                                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Historial de Sincronización</div>
                                                                    {integration.syncLogs?.length === 0 ? (
                                                                        <div className="text-[10px] text-muted-foreground italic">No hay logs registrados todavía.</div>
                                                                    ) : (
                                                                        <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                                                                            {integration.syncLogs?.map((log: any) => (
                                                                                <div key={log.id} className="text-[10px] flex justify-between gap-2 p-1.5 bg-white rounded border">
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <span className="font-semibold text-slate-800">
                                                                                            {log.syncType === 'products' ? 'Catálogo' : log.syncType === 'sales' ? 'Ventas' : 'Inventario'}: 
                                                                                        </span>
                                                                                        <span className="text-slate-600 truncate inline-block w-full max-w-[200px] align-bottom ml-1">{log.message}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                                        <Badge className={
                                                                                            log.status === 'success' ? "bg-emerald-100 text-emerald-800 text-[8px] px-1 py-0 border-none font-bold" : "bg-rose-100 text-rose-800 text-[8px] px-1 py-0 border-none font-bold"
                                                                                        }>
                                                                                            {log.status === 'success' ? 'Exitoso' : 'Error'}
                                                                                        </Badge>
                                                                                        <span className="text-muted-foreground text-[8px]">{new Date(log.createdAt).toLocaleTimeString('es-PA')}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </ContentContainer>

            {/* --- MODALES DE SUSCRIPCIÓN --- */}

            {/* PayPal Subscription Payment Modal */}
            {showPaypalModal && selectedPlanForPay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setShowPaypalModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            disabled={paymentStep === 'simulating'}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {paymentStep === 'details' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-slate-900">Suscripción al Plan</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Completa el pago recurrente para activar tu plan fiscal de inmediato.</p>
                                </div>

                                <div className="bg-slate-50 border rounded-lg p-4 space-y-2 text-sm text-slate-700">
                                    <div className="flex justify-between font-semibold">
                                        <span>Plan {selectedPlanForPay.name}</span>
                                        <span>${billingCycle === 'monthly' ? selectedPlanForPay.price.monthly : selectedPlanForPay.price.yearly} / mes</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Ciclo de facturación</span>
                                        <span>{billingCycle === 'monthly' ? 'Mensual' : 'Anual'}</span>
                                    </div>
                                    {billingCycle === 'yearly' && (
                                        <div className="flex justify-between text-xs text-indigo-600 font-semibold border-t pt-2">
                                            <span>Cobro total anual</span>
                                            <span>${(selectedPlanForPay.price.yearly * 12).toFixed(2)} USD</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                                        <div className="space-y-3">
                                            <div id="paypal-button-container" className="w-full min-h-[50px] relative z-10"></div>
                                            {!isPaypalSdkLoaded && (
                                                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Cargando botones de PayPal...
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-[10px] text-muted-foreground text-center">
                                                Al presionar Pagar, se iniciará el proceso seguro de suscripción con PayPal Vault.
                                            </div>
                                            <button
                                                onClick={executePayment}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#FFC439]"
                                            >
                                                <span className="italic font-extrabold text-lg">PayPal</span>
                                                <span className="text-sm font-semibold tracking-wider">SUSCRIBIRSE (Simulado)</span>
                                            </button>
                                        </>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowPaypalModal(false)}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {paymentStep === 'simulating' && (
                            <div className="text-center py-12 space-y-6">
                                <Loader2 className="h-12 w-12 text-[#003087] mx-auto animate-spin" />
                                <div className="space-y-2">
                                    <h4 className="font-bold text-slate-900">Conectando con PayPal...</h4>
                                    <p className="text-xs text-muted-foreground">Autorizando token de suscripción y vinculando cuenta...</p>
                                </div>
                            </div>
                        )}

                        {paymentStep === 'success' && (
                            <div className="text-center py-8 space-y-6">
                                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="h-10 w-10 stroke-[3]" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-slate-900">¡Suscripción Activada!</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Tu cuenta ha sido actualizada al plan <strong className="text-indigo-600">{selectedPlanForPay.name}</strong>. Ya puedes emitir documentos fiscales de forma automática.
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                    onClick={() => {
                                        setShowPaypalModal(false);
                                        router.refresh();
                                    }}
                                >
                                    Ir a mi Dashboard
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Subscription Warning Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            disabled={isPlanLoading}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-rose-100 text-rose-700 rounded-full shrink-0">
                                    <XCircle className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">¿Cancelar tu suscripción?</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Si cancelas tu suscripción, tu empresa bajará inmediatamente al **Plan Gratuito Asistido**.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4 text-xs text-rose-800 space-y-2">
                                <p className="font-semibold">Esto implica las siguientes restricciones:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Límite de facturación reducido a **10 documentos al mes** (actualmente {company.planType === 'pro' ? '500' : '100'}).</li>
                                    <li>Desactivación del timbrado automático con el PAC integrado.</li>
                                    <li>Restablecimiento del ambiente DGI obligatorio a modo **Pruebas (Test)**.</li>
                                    <li>Pérdida de integraciones WhatsApp API y Webhooks salientes.</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowCancelModal(false)}
                                    disabled={isPlanLoading}
                                >
                                    Conservar Plan
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                                    onClick={executeCancelSubscription}
                                    disabled={isPlanLoading}
                                >
                                    {isPlanLoading ? 'Procesando...' : 'Confirmar Cancelación'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Compra de Bloques de Documentos */}
            {showPurchaseBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setShowPurchaseBlockModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            disabled={isPurchasingBlock}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-900">Comprar Bloque de Documentos</h3>
                                <p className="text-xs text-muted-foreground mt-1">Adquiere folios electrónicos adicionales para seguir facturando este mes.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-muted-foreground">Seleccionar Tamaño del Bloque</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { size: 100, price: 5.00, label: '100 docs' },
                                        { size: 500, price: 25.00, label: '500 docs' },
                                        { size: 1000, price: 50.00, label: '1,000 docs' }
                                    ].map((block) => (
                                        <button
                                            key={block.size}
                                            type="button"
                                            onClick={() => setSelectedBlockSize(block.size)}
                                            className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                                                selectedBlockSize === block.size
                                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-600/10'
                                                    : 'border-border bg-white text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{block.label}</span>
                                            <span className="text-xs font-semibold text-indigo-600">${block.price.toFixed(2)}</span>
                                            <span className="text-[9px] text-muted-foreground">($0.05 c/u)</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-indigo-50/30 border border-indigo-100 rounded-lg p-4 space-y-2 text-xs text-indigo-950/80">
                                <div className="flex justify-between font-semibold">
                                    <span>Costo del Bloque</span>
                                    <span>${(selectedBlockSize * 0.05).toFixed(2)} USD</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Precio por documento</span>
                                    <span>$0.05 USD</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground border-t pt-2 mt-1">
                                    * Los documentos adicionales no expiran al final del mes y se consumirán solo si excedes tu límite base.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    onClick={handlePurchaseBlock}
                                    disabled={isPurchasingBlock}
                                    className="w-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold py-5 flex items-center justify-center gap-2 border-none shadow-sm hover:shadow-md"
                                >
                                    {isPurchasingBlock ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="italic font-extrabold text-lg">PayPal</span>
                                            <span className="text-sm font-semibold tracking-wider">COMPRAR AHORA (Simulado)</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowPurchaseBlockModal(false)}
                                    disabled={isPurchasingBlock}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
