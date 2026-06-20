'use client';

import { useState } from 'react';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, CreditCard, Sparkles, Zap, Building } from 'lucide-react';

export default function AdminBillingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Current active plan simulation
    const currentPlan = 'free';

    const plans = [
        {
            id: 'free',
            name: 'Gratis',
            description: 'Ideal para evaluar el sistema y pruebas iniciales.',
            price: {
                monthly: 0,
                yearly: 0,
            },
            features: [
                'Hasta 10 facturas / documentos al mes',
                '1 Sucursal y 1 Caja habilitada',
                'Integración DGI en ambiente de pruebas',
                'Gestión de clientes y productos básica',
                'Reportes estándar en PDF',
            ],
            cta: 'Plan Actual',
            highlight: false,
            variant: 'outline' as const,
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'Para empresas en crecimiento que facturan oficialmente.',
            price: {
                monthly: 29,
                yearly: 24, // $288 billed annually
            },
            features: [
                'Hasta 500 facturas / documentos al mes',
                'Integración oficial DGI en producción',
                'Soporte para 3 Sucursales y 3 Cajas',
                'Reportes avanzados (Excel, CSV, PDF)',
                'Soporte prioritario por correo y chat',
                'Acceso para hasta 3 usuarios',
            ],
            cta: 'Actualizar a Pro',
            highlight: true,
            variant: 'default' as const,
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'Solución a la medida para operaciones ilimitadas.',
            price: {
                monthly: 79,
                yearly: 65, // $780 billed annually
            },
            features: [
                'Facturas y documentos ilimitados',
                'Sucursales y cajas ilimitadas',
                'Usuarios ilimitados con roles finos',
                'API de acceso para integraciones externas',
                'Gerente de cuenta y soporte 24/7',
                'Copias de seguridad diarias automatizadas',
            ],
            cta: 'Contactar Soporte',
            highlight: false,
            variant: 'outline' as const,
        },
    ];

    return (
        <ContentContainer className="py-8">
            <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Planes y Facturación</h1>
                    <p className="text-muted-foreground">Gestiona la suscripción de tu cuenta y los límites de consumo fiscal</p>
                </div>
            </div>

            {/* Current Status Banner */}
            <Card className="mb-10 border-indigo-100 bg-indigo-50/30">
                <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-indigo-950">Plan Actual: Gratis (Pruebas)</h3>
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">Activo</Badge>
                            </div>
                            <p className="text-sm text-indigo-900/80">Tu cuenta está en modo demostración. Puedes generar hasta 10 facturas de prueba al mes.</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto">
                        <div className="text-xs text-indigo-900/60 mb-2">Consumo de documentos:</div>
                        <div className="w-full sm:w-48 bg-indigo-100 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '20%' }} />
                        </div>
                        <div className="flex justify-between text-xs text-indigo-900/70 mt-1">
                            <span>2 generados</span>
                            <span>10 límite</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Cycle Selector */}
            <div className="flex flex-col items-center gap-4 mb-10">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-12">
                {plans.map((plan) => {
                    const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
                    const isCurrent = plan.id === currentPlan;

                    return (
                        <Card
                            key={plan.id}
                            className={`flex flex-col h-full relative transition-all duration-300 hover:shadow-lg ${
                                plan.highlight
                                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10 scale-100 md:scale-[1.03]'
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
                                    {plan.id === 'pro' && <Sparkles className="h-5 w-5 text-indigo-500" />}
                                    {plan.id === 'enterprise' && <Building className="h-5 w-5 text-slate-500" />}
                                </CardTitle>
                                <CardDescription className="min-h-[40px] mt-2">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col pt-0">
                                {/* Price Section */}
                                <div className="mb-6">
                                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                                        ${price}
                                    </span>
                                    <span className="text-muted-foreground ml-1 text-sm font-medium">/ mes</span>
                                    {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                                        <div className="text-xs text-indigo-600 font-semibold mt-1">
                                            Cobrado anualmente (${price * 12}/año)
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
                                    disabled={isCurrent}
                                >
                                    {isCurrent ? 'Tu Plan Actual' : plan.cta}
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
        </ContentContainer>
    );
}
