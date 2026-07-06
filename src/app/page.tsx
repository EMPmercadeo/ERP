import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Calculator,
    FileText,
    Landmark,
    Boxes,
    BarChart3,
    CheckCircle2,
    Store,
    Truck,
    Briefcase,
    UtensilsCrossed,
    ArrowRight,
    UserPlus,
    Building2,
    Package,
    Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/layout/Footer';
import { FaqAccordion } from '@/components/landing/FaqAccordion';

export const metadata: Metadata = {
    title: 'ERP Panamá — Contabilidad, Facturación Electrónica DGI e Inventario en un solo sistema',
    description:
        'Contabilidad de partida doble automática, facturación electrónica ante la DGI e inventario multi-sucursal en un solo sistema, hecho para negocios panameños. Crea tu cuenta gratis.',
    keywords: [
        'ERP Panamá',
        'facturación electrónica Panamá',
        'DGI',
        'PAC',
        'CAFE',
        'contabilidad Panamá',
        'software contable Panamá',
        'inventario multi-sucursal',
    ],
    openGraph: {
        title: 'ERP Panamá — Contabilidad, Facturación Electrónica DGI e Inventario',
        description:
            'El sistema que une contabilidad, facturación electrónica DGI e inventario multi-sucursal para negocios panameños.',
        type: 'website',
        locale: 'es_PA',
        siteName: 'ERP Panamá',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ERP Panamá — Contabilidad, Facturación Electrónica DGI e Inventario',
        description:
            'El sistema que une contabilidad, facturación electrónica DGI e inventario multi-sucursal para negocios panameños.',
    },
    alternates: {
        canonical: '/',
    },
};

const FUNCIONALIDADES = [
    {
        icon: Calculator,
        title: 'Motor contable automático',
        description:
            'Cada factura, cobro, compra y pago genera su asiento de partida doble automáticamente en tu Plan de Cuentas — sin capturar nada dos veces.',
    },
    {
        icon: FileText,
        title: 'Facturación electrónica DGI',
        description:
            'Emisión de facturas, notas de crédito y notas de débito con la numeración y estructura que exige la DGI. La integración con el PAC (proveedor autorizado de calificación) está en preparación — te avisaremos apenas esté disponible en producción.',
    },
    {
        icon: Landmark,
        title: 'Conciliación bancaria',
        description:
            'Importa el estado de cuenta de tu banco (CSV/Excel) y concilia cada movimiento contra tus asientos contables desde una sola pantalla.',
    },
    {
        icon: Boxes,
        title: 'Inventario multi-almacén con lotes y FEFO',
        description:
            'Controla stock por sucursal y bodega, con lotes y vencimientos que se descuentan automáticamente por FEFO (primero en vencer, primero en salir).',
    },
    {
        icon: BarChart3,
        title: 'Reportes financieros',
        description:
            'Libro diario, libro mayor, balance de comprobación, estado de resultados y balance general — generados en tiempo real desde tus propios asientos, no desde una hoja de cálculo aparte.',
    },
];

const PASOS = [
    {
        icon: UserPlus,
        title: 'Crea tu cuenta',
        description: 'Regístrate con tu correo o con Google. Sin tarjeta de crédito para empezar.',
    },
    {
        icon: Building2,
        title: 'Configura tu sucursal y caja',
        description: 'Creamos automáticamente tu primera sucursal, caja y bodega para que empieces a operar de inmediato.',
    },
    {
        icon: Package,
        title: 'Carga tus productos',
        description: 'Agrega tu catálogo manualmente o impórtalo desde Excel/CSV en minutos.',
    },
    {
        icon: Receipt,
        title: 'Emite tu primera factura',
        description: 'Factura a tus clientes con el control de inventario y la contabilidad ya conectados por debajo.',
    },
];

const RUBROS = [
    { icon: Store, title: 'Comercio minorista', description: 'Tiendas y puntos de venta que necesitan facturar e inventariar producto terminado.' },
    { icon: Truck, title: 'Distribuidoras', description: 'Control de compras, múltiples bodegas y cuentas por cobrar a mayor volumen.' },
    { icon: Briefcase, title: 'Servicios profesionales', description: 'Facturación de servicios sin inventario, con cotizaciones y cuentas por cobrar.' },
    { icon: UtensilsCrossed, title: 'Restaurantes', description: 'Punto de venta rápido con control de inventario de insumos y ventas del día.' },
];

const GLOSARIO = [
    { term: 'DGI', def: 'Dirección General de Ingresos — la autoridad fiscal de Panamá, encargada de recaudar impuestos y regular la facturación electrónica.' },
    { term: 'Factura Electrónica', def: 'Documento fiscal digital, con una estructura y firma definidas por la DGI, que reemplaza a la factura de papel para efectos legales y tributarios.' },
    { term: 'PAC', def: 'Proveedor Autorizado de Calificación — empresa autorizada por la DGI para validar y calificar tus facturas electrónicas antes de que tengan validez fiscal.' },
    { term: 'CAFE', def: 'Comprobante Auxiliar de Factura Electrónica — la representación impresa o en PDF de una factura electrónica, para entregar al cliente.' },
    { term: 'RUC', def: 'Registro Único de Contribuyente — el número que identifica fiscalmente a una persona o empresa ante la DGI.' },
    { term: 'DV', def: 'Dígito Verificador — un dígito adicional al RUC que sirve para validar que el número es correcto.' },
    { term: 'Autorización (DGI)', def: 'El permiso que otorga la DGI, a través del PAC, para que una factura electrónica sea válida fiscalmente.' },
];

const PLANES = [
    {
        name: 'Emprendedor',
        price: '$24.99',
        description: 'Para negocios que están empezando a facturar electrónicamente.',
        features: [
            '1 sucursal',
            'Hasta 100 facturas DGI/mes',
            '2 usuarios',
            'Contabilidad automática de partida doble',
            'Inventario básico (un almacén)',
        ],
        cta: 'Crear cuenta gratis',
        href: '/register',
        highlighted: false,
    },
    {
        name: 'Negocio',
        price: '$44.99',
        description: 'Para negocios en crecimiento con más de un punto de venta.',
        features: [
            'Hasta 3 sucursales',
            'Facturación de alto volumen',
            'Hasta 10 usuarios',
            'Conciliación bancaria',
            'Inventario multi-almacén con lotes/FEFO',
            'Reportes financieros avanzados',
            'Soporte prioritario',
        ],
        cta: 'Crear cuenta gratis',
        href: '/register',
        highlighted: true,
    },
    {
        name: 'Empresarial',
        price: 'Cotizar',
        description: 'Para grupos empresariales y operaciones multi-empresa.',
        features: [
            'Sucursales y usuarios ilimitados',
            'Multi-empresa',
            'Integraciones a medida',
            'Soporte dedicado',
        ],
        cta: 'Hablar con ventas',
        href: '/register',
        highlighted: false,
    },
];

const FAQS = [
    {
        question: '¿Necesito comprar hardware especial?',
        answer:
            'No. ERP Panamá funciona desde cualquier navegador, en computadora, tablet o celular. No necesitas instalar nada ni comprar equipos adicionales para empezar a usarlo.',
    },
    {
        question: '¿Qué pasa si todavía no tengo un PAC contratado?',
        answer:
            'Puedes crear tu cuenta y empezar a configurar tu contabilidad, productos e inventario sin problema. La emisión de facturas fiscales ante la DGI requiere tener un PAC habilitado — nuestro equipo te acompaña en ese proceso apenas esté disponible.',
    },
    {
        question: '¿Puedo migrar mis datos desde otro sistema?',
        answer:
            'Sí. Puedes importar tus clientes, productos y proveedores desde Excel/CSV. Si tienes un volumen grande de información histórica, escríbenos y te ayudamos con la migración.',
    },
    {
        question: '¿Puedo cambiar de plan más adelante?',
        answer:
            'Sí, puedes subir o bajar de plan cuando lo necesites desde la configuración de tu cuenta, sin perder tu información.',
    },
    {
        question: '¿Mis datos están seguros?',
        answer:
            'Cada empresa tiene sus datos completamente aislados dentro de la plataforma, y el acceso siempre requiere autenticación. No compartimos tu información con terceros.',
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <LandingHeader />

            {/* Hero */}
            <section className="relative overflow-hidden bg-brand-3 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                            Contabilidad, facturación electrónica DGI e inventario, en un solo sistema
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                            ERP Panamá une la contabilidad de partida doble automática, la facturación electrónica ante la DGI
                            y el control de inventario multi-sucursal — para que dejes de operar tu negocio entre hojas de
                            cálculo sueltas.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button asChild size="lg" className="w-full bg-white text-brand-3 hover:bg-slate-100 sm:w-auto">
                                <Link href="/register">
                                    Crear cuenta gratis
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                            >
                                <a href="#precios">Ver precios</a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Funcionalidades */}
            <section id="funcionalidades" className="py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Funcionalidades</h2>
                        <p className="mt-4 text-base text-slate-600">
                            Todo lo que necesitas para llevar la parte financiera de tu negocio, sin conectar sistemas sueltos.
                        </p>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FUNCIONALIDADES.map((item) => (
                            <div key={item.title} className="rounded-xl border border-slate-200 p-6">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-1/10">
                                    <item.icon className="h-5 w-5 text-brand-1" />
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-brand-3">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cómo funciona */}
            <section id="como-funciona" className="bg-slate-50 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Cómo funciona</h2>
                        <p className="mt-4 text-base text-slate-600">De cero a tu primera factura, en cuatro pasos.</p>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {PASOS.map((paso, index) => (
                            <div key={paso.title} className="relative text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-1 text-white">
                                    <paso.icon className="h-6 w-6" />
                                </div>
                                <span className="mt-3 block text-xs font-bold uppercase tracking-wider text-brand-1">
                                    Paso {index + 1}
                                </span>
                                <h3 className="mt-1 text-base font-semibold text-brand-3">{paso.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{paso.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rubros */}
            <section id="rubros" className="py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Para tu tipo de negocio</h2>
                        <p className="mt-4 text-base text-slate-600">
                            Pensado para negocios panameños que facturan ante la DGI, sin importar el rubro.
                        </p>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {RUBROS.map((rubro) => (
                            <div key={rubro.title} className="rounded-xl border border-slate-200 p-6 text-center">
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-brand-1/10">
                                    <rubro.icon className="h-5 w-5 text-brand-1" />
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-brand-3">{rubro.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{rubro.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Glosario */}
            <section id="glosario" className="bg-slate-50 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Glosario</h2>
                        <p className="mt-4 text-base text-slate-600">
                            Términos que todo dueño de negocio panameño necesita entender antes de facturar electrónicamente.
                        </p>
                    </div>
                    <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
                        {GLOSARIO.map((item) => (
                            <div key={item.term} className="rounded-xl bg-white p-5 shadow-sm">
                                <dt className="text-sm font-bold text-brand-1">{item.term}</dt>
                                <dd className="mt-1 text-sm leading-relaxed text-slate-600">{item.def}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* Precios */}
            <section id="precios" className="py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Precios</h2>
                        <p className="mt-4 text-base text-slate-600">Planes en dólares (USD), la moneda oficial de Panamá.</p>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
                        {PLANES.map((plan) => (
                            <div
                                key={plan.name}
                                className={`flex flex-col rounded-2xl border p-8 ${
                                    plan.highlighted ? 'border-brand-1 shadow-lg ring-1 ring-brand-1' : 'border-slate-200'
                                }`}
                            >
                                {plan.highlighted && (
                                    <span className="mb-4 inline-block w-fit rounded-full bg-brand-1 px-3 py-1 text-xs font-semibold text-white">
                                        Más elegido
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-brand-3">{plan.name}</h3>
                                <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold tracking-tight text-brand-3">{plan.price}</span>
                                    {plan.price !== 'Cotizar' && <span className="text-sm text-slate-500">/mes</span>}
                                </div>
                                <ul className="mt-6 flex-1 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
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
                    <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-slate-500">
                        Los límites de facturas y usuarios por plan pueden ajustarse — escríbenos si tu negocio necesita algo distinto.
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-slate-50 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Preguntas frecuentes</h2>
                    </div>
                    <div className="mt-12">
                        <FaqAccordion items={FAQS} />
                    </div>
                </div>
            </section>

            {/* CTA final */}
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

            {/* Footer (compartido con el resto del sitio: términos, privacidad, cookies) */}
            <Footer />
        </div>
    );
}
