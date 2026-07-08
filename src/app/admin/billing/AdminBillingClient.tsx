'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, CreditCard, Sparkles, Zap, Building, Loader2 } from 'lucide-react';
import { updateCompanyPlan } from '@/lib/actions/settings';

interface AdminBillingClientProps {
    company: {
        id: string;
        razonSocial: string;
        planType: string;
        subscriptionStatus: string;
    };
    invoicesCount: number;
}

export function AdminBillingClient({ company, invoicesCount }: AdminBillingClientProps) {
    const router = useRouter();
    const [planType, setPlanType] = useState(company.planType);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isPlanLoading, setIsPlanLoading] = useState(false);

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

    const planInfo = getPlanLimitsInfo(planType);
    const currentLimit = planInfo.limit;
    const progressWidth = currentLimit === Infinity 
        ? 0 
        : Math.min((invoicesCount / currentLimit) * 100, 100);

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
                setPlanType(newPlan);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error('Error al cambiar de plan.');
        } finally {
            setIsPlanLoading(false);
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
        <div className="space-y-6">
            {/* Current Status Banner */}
            <Card className="border-brand-1/10 bg-brand-1/30">
                <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-1/10 text-brand-2 rounded-lg shrink-0">
                            {planType === 'free' && <Sparkles className="h-6 w-6" />}
                            {planType === 'basic' && <Zap className="h-6 w-6" />}
                            {planType === 'pro' && <Zap className="h-6 w-6 animate-pulse text-amber-500" />}
                            {planType === 'enterprise' && <Building className="h-6 w-6 text-brand-1" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-brand-3">
                                    Plan Actual: {planType === 'free' ? 'Gratuito Asistido' : planType === 'basic' ? 'Básico PAC' : planType === 'pro' ? 'Pro PAC' : 'Enterprise Embedded'}
                                </h3>
                                <Badge variant="secondary" className="bg-brand-1/10 text-brand-2 border-brand-1/20 uppercase text-[10px]">
                                    {company.subscriptionStatus === 'active' ? 'Activo' : company.subscriptionStatus}
                                </Badge>
                            </div>
                            <p className="text-sm text-brand-3/80 mt-1">
                                {planInfo.desc}
                            </p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto">
                        <div className="text-xs text-brand-3/60 mb-2">Consumo de documentos:</div>
                        <div className="w-full sm:w-48 bg-brand-1/10 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-brand-1 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${progressWidth}%` }} 
                            />
                        </div>
                        <div className="flex justify-between text-xs text-brand-3/70 mt-1">
                            <span>{invoicesCount} generados</span>
                            <span>{planInfo.label}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Cycle Selector */}
            <div className="flex flex-col items-center gap-4 mb-6">
                <div className="inline-flex items-center p-1 bg-muted rounded-lg border border-border shadow-inner">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            billingCycle === 'monthly'
                                ? 'bg-white text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Facturación Mensual
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                            billingCycle === 'yearly'
                                ? 'bg-brand-1 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span>Facturación Anual</span>
                        <Badge className="bg-brand-1/10 hover:bg-brand-1/10 text-brand-2 hover:text-brand-2 border-none px-1.5 py-0 text-[10px] font-bold">
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
                    const isCurrent = plan.id === planType;
                    const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;

                    return (
                        <Card
                            key={plan.id}
                            className={`flex flex-col h-full relative transition-all duration-300 hover:shadow-lg ${
                                plan.highlight
                                    ? 'border-brand-1 shadow-md ring-2 ring-brand-1/10 scale-100 md:scale-[1.02]'
                                    : 'border-border'
                            }`}
                        >
                            {plan.highlight && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-1 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
                                    <Zap className="h-3 w-3 fill-white" />
                                    Más Popular
                                </span>
                            )}

                            <CardHeader className="pb-6">
                                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                                    <span>{plan.name}</span>
                                    {plan.id === 'free' && <Sparkles className="h-5 w-5 text-brand-1" />}
                                    {plan.id === 'basic' && <Zap className="h-5 w-5 text-brand-1" />}
                                    {plan.id === 'pro' && <Zap className="h-5 w-5 text-amber-500" />}
                                    {plan.id === 'enterprise' && <Building className="h-5 w-5 text-muted-foreground" />}
                                </CardTitle>
                                <CardDescription className="min-h-[40px] mt-2">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col pt-0">
                                {/* Price Section */}
                                <div className="mb-6">
                                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                                        ${price}
                                    </span>
                                    <span className="text-muted-foreground ml-1 text-sm font-medium">/ mes</span>
                                    {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                                        <div className="text-xs text-brand-1 font-semibold mt-1">
                                            Cobrado anualmente (${price * 12}/año)
                                        </div>
                                    )}
                                </div>

                                <Separator className="mb-6" />

                                {/* Features List */}
                                <ul className="space-y-3.5 flex-1 mb-8 text-sm text-muted-foreground">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <div className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                                                plan.highlight
                                                    ? 'bg-brand-1/10 text-brand-2'
                                                    : 'bg-muted text-foreground'
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
                                            ? 'bg-muted text-muted-foreground border-none cursor-default hover:bg-muted'
                                            : plan.highlight
                                                ? 'bg-brand-1 hover:bg-brand-2 text-white shadow-sm hover:shadow-md'
                                                : 'border-brand-1/20 text-brand-2 bg-white hover:bg-brand-1/50'
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
            <Card className="border-border bg-muted/30">
                <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-8">
                    <div className="flex items-center gap-4">
                        <CreditCard className="h-8 w-8 text-muted-foreground shrink-0" />
                        <div>
                            <h4 className="font-semibold text-foreground">¿Tienes dudas sobre los planes o facturación?</h4>
                            <p className="text-sm text-muted-foreground">Estamos aquí para ayudarte a elegir el plan perfecto para cumplir con los requerimientos fiscales de la DGI.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="shrink-0 border-border hover:bg-accent">
                        Contactar Asesor
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
