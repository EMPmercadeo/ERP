import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderInicio } from '@/components/inicio/HeaderInicio';
import { Footer } from '@/components/layout/Footer';
import { FaqAccordion } from '@/components/inicio/FaqAccordion';

export const metadata: Metadata = {
    title: 'Precios: Planes desde $19.99/mes | ERP Panamá',
    description:
        'Planes de ERP Panamá en dólares (USD): Emprendedor, Negocio, Pro y Empresa. Contabilidad automática, facturación electrónica DGI e inventario según el tamaño de tu negocio.',
    alternates: { canonical: '/precios' },
    openGraph: {
        title: 'Precios de ERP Panamá',
        description: 'Planes en dólares (USD), la moneda oficial de Panamá. Cambia de plan cuando lo necesites.',
        type: 'website',
        locale: 'es_PA',
        siteName: 'ERP Panamá',
    },
};

const PLANES = [
    {
        name: 'Emprendedor',
        price: '$19.99',
        description: 'Ideal para independientes y emprendedores que inician.',
        features: [
            '150 documentos electrónicos al mes',
            '1 usuario incluido',
            'Clientes, productos y servicios',
            'Cotizaciones',
            'Facturas electrónicas',
            'Descarga PDF/XML',
            'Cuentas por cobrar',
            'Reportes básicos',
            'Envío por correo o WhatsApp',
        ],
        cta: 'Actualizar a Emprendedor',
        href: '/register',
        highlighted: false,
    },
    {
        name: 'Negocio',
        price: '$34.99',
        description: 'Para pequeños negocios con necesidades estándar.',
        features: [
            'Todo lo del plan Emprendedor',
            '300 documentos electrónicos al mes',
            '2 usuarios incluidos',
            'Inventario básico',
            'Notas de crédito y débito',
            'Reportes de ventas',
            'Control de pagos',
            'Dashboard mensual',
            'Integración POS básica',
        ],
        cta: 'Actualizar a Negocio',
        href: '/register',
        highlighted: false,
    },
    {
        name: 'Pro',
        price: '$54.99',
        description: 'Para empresas medianas en crecimiento constante.',
        features: [
            'Todo lo del plan Negocio',
            '600 documentos electrónicos al mes',
            '5 usuarios incluidos',
            'Permisos por usuario (roles)',
            'Sucursales y cajas',
            'Reportes avanzados',
            'Exportación contable',
            'Automatizaciones básicas',
            'Soporte POS avanzado',
        ],
        cta: 'Actualizar a Pro',
        href: '/register',
        highlighted: true,
    },
    {
        name: 'Empresa',
        price: '$89.99',
        description: 'Para corporaciones y operaciones a gran escala.',
        features: [
            'Todo lo del plan Pro',
            '1,000 documentos electrónicos al mes',
            '10 usuarios incluidos',
            'Soporte prioritario',
            'API y Webhooks salientes',
            'Integraciones y configuración asistida',
            'Multiempresa y multisucursal avanzada',
        ],
        cta: 'Actualizar a Empresa',
        href: '/register',
        highlighted: false,
    },
];

const FAQS_PRECIOS = [
    {
        question: '¿Qué cuenta como "documento electrónico" dentro del límite mensual?',
        answer:
            'Cada factura, nota de crédito o nota de débito electrónica emitida ante la DGI cuenta dentro del límite mensual de tu plan. Las cotizaciones no consumen documentos electrónicos, ya que aún no son un documento fiscal.',
    },
    {
        question: '¿Puedo cambiar de plan más adelante?',
        answer:
            'Sí, puedes subir o bajar de plan cuando lo necesites desde la configuración de tu cuenta, sin perder tu información histórica.',
    },
    {
        question: '¿Qué pasa si supero el límite de documentos de mi plan?',
        answer:
            'Te avisamos antes de que llegues al límite mensual para que puedas actualizar tu plan a tiempo y seguir facturando sin interrupciones.',
    },
    {
        question: '¿Qué pasa si todavía no tengo un PAC contratado?',
        answer:
            'Puedes crear tu cuenta y empezar a configurar tu contabilidad, productos e inventario sin problema. La emisión de facturas fiscales ante la DGI requiere tener un PAC habilitado. Nuestro equipo te acompaña en ese proceso apenas esté disponible.',
    },
    {
        question: '¿Hay contrato de permanencia?',
        answer:
            'No. Los planes son mensuales y puedes cambiar de plan cuando lo necesites desde la configuración de tu cuenta.',
    },
];

export default function PreciosPage() {
    return (
        <div className="min-h-screen bg-white">
            <HeaderInicio />

            <section className="bg-brand-3 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Precios</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        Planes en dólares (USD), la moneda oficial de Panamá.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {PLANES.map((plan) => (
                            <div
                                key={plan.name}
                                className={`flex flex-col rounded-2xl border p-8 ${
                                    plan.highlighted ? 'border-brand-1 shadow-lg ring-1 ring-brand-1' : 'border-border'
                                }`}
                            >
                                {plan.highlighted && (
                                    <span className="mb-4 inline-block w-fit rounded-full bg-brand-1 px-3 py-1 text-xs font-semibold text-white">
                                        Más Popular
                                    </span>
                                )}
                                <h2 className="text-lg font-bold text-brand-3">{plan.name}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold tracking-tight text-brand-3">{plan.price}</span>
                                    <span className="text-sm text-muted-foreground">/mes</span>
                                </div>
                                <ul className="mt-6 flex-1 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-1" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    asChild
                                    className={`mt-8 w-full ${plan.highlighted ? 'bg-brand-1 hover:bg-brand-2' : ''}`}
                                    variant={plan.highlighted ? 'default' : 'outline'}
                                >
                                    <Link href={plan.href}>{plan.cta}</Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                    <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
                        Precios en dólares (USD). Puedes cambiar de plan en cualquier momento desde la configuración de tu cuenta.
                    </p>
                </div>
            </section>

            <section className="bg-secondary py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Preguntas frecuentes sobre precios</h2>
                    </div>
                    <div className="mt-12">
                        <FaqAccordion items={FAQS_PRECIOS} />
                    </div>
                </div>
            </section>

            <section className="bg-brand-3 py-16 sm:py-20">
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Empieza a facturar y contabilizar en un solo lugar
                    </h2>
                    <p className="mt-4 text-base text-slate-300">Crea tu cuenta gratis, sin tarjeta de crédito.</p>
                    <div className="mt-8">
                        <Button asChild size="lg" className="bg-white text-brand-3 hover:bg-slate-100">
                            <Link href="/register">
                                Crear cuenta gratis
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
