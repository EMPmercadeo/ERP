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
    Check,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderInicio } from '@/components/inicio/HeaderInicio';
import { Footer } from '@/components/layout/Footer';
import { FaqAccordion } from '@/components/inicio/FaqAccordion';

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

export default function PaginaInicio() {
    return (
        <div className="min-h-screen bg-white">
            <HeaderInicio />

            {/* Hero */}
            <section className="relative overflow-hidden bg-brand-3 py-16 sm:py-28">
                {/* Textura sutil de puntos — profundidad sin gradientes ni color decorativo */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='white'/%3E%3C/svg%3E\")",
                    }}
                />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        {/* Columna de texto */}
                        <div className="text-center lg:text-left">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Hecho para PyMEs panameñas
                            </span>
                            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Contabilidad, facturación DGI e inventario,
                                <br className="hidden lg:block" /> en un solo sistema
                            </h1>
                            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg lg:mx-0" /* design-token-exempt */>
                                Cada factura genera su asiento contable automáticamente. Deja de operar tu negocio
                                entre hojas de cálculo sueltas.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                                <Button asChild size="lg" className="w-full bg-white text-brand-3 hover:bg-slate-100 sm:w-auto" /* design-token-exempt */>
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
                                    <Link href="/precios">Ver precios</Link>
                                </Button>
                            </div>
                            <p className="mt-4 text-xs text-slate-400">Sin tarjeta de crédito · Configuras tu empresa en minutos</p>
                        </div>

                        {/* Bento de producto: vista previa real del sistema, no fotos de stock */}
                        <div className="relative mx-auto w-full max-w-md pt-6 lg:mx-0 lg:max-w-none lg:pt-0">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Ventas del mes */}
                                <div className="col-span-2 rounded-xl bg-white p-5 shadow-2xl">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Ventas del mes</span>
                                        <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-bold text-success">+18%</span>
                                    </div>
                                    <p className="mt-1.5 text-2xl font-bold text-brand-3">$12,432.00</p>
                                    <svg viewBox="0 0 300 70" preserveAspectRatio="none" className="mt-3 h-14 w-full">
                                        <path
                                            d="M0,50 C30,55 45,22 75,30 C105,38 120,10 150,18 C180,26 195,42 225,32 C255,22 270,14 300,18 L300,70 L0,70 Z"
                                            fill="#073674"
                                            fillOpacity="0.12"
                                        />
                                        <path
                                            d="M0,50 C30,55 45,22 75,30 C105,38 120,10 150,18 C180,26 195,42 225,32 C255,22 270,14 300,18"
                                            fill="none"
                                            stroke="#073674"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>

                                {/* Factura autorizada */}
                                <div className="rounded-xl bg-white p-4 shadow-2xl">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-bg text-success">
                                        <Check className="h-4 w-4" />
                                    </div>
                                    <p className="mt-3 text-xs font-semibold text-brand-3">Factura Autorizada</p>
                                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">FE-0001-000045</p>
                                </div>

                                {/* Documentos usados */}
                                <div className="rounded-xl bg-white p-4 shadow-2xl">
                                    <p className="text-[10px] font-medium text-muted-foreground">Documentos usados</p>
                                    <p className="mt-1 text-lg font-bold text-brand-3">
                                        128<span className="text-xs font-normal text-muted-foreground">/300</span>
                                    </p>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-brand-1/10">
                                        <div className="h-1.5 rounded-full bg-brand-1" style={{ width: '42%' }} />
                                    </div>
                                </div>

                                {/* Equipo / multiusuario */}
                                <div className="col-span-2 flex items-center gap-3 rounded-xl bg-white p-4 shadow-2xl">
                                    <div className="flex -space-x-2">
                                        {['MG', 'JR', 'AL', '+7'].map((initials) => (
                                            <div
                                                key={initials}
                                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-1 text-[9px] font-bold text-white"
                                            >
                                                {initials}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Multiusuario con permisos por rol</p>
                                </div>
                            </div>

                            {/* Badge flotante de cumplimiento */}
                            <div className="absolute -top-3 -right-3 hidden -rotate-2 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 shadow-2xl sm:flex">
                                <ShieldCheck className="h-4 w-4 text-brand-1" />
                                <span className="text-[10px] font-semibold text-brand-3">DGI · PAC · CAFE</span>
                            </div>
                        </div>
                    </div>

                    {/* Highlights honestos, sin cifras inventadas */}
                    <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4 lg:mt-20">
                        {[
                            { label: 'Asientos automáticos', value: '100%' },
                            { label: 'Bodegas y sucursales', value: 'Ilimitadas' },
                            { label: 'Documentos DGI', value: 'FE · NC · ND' },
                            { label: 'Soporte', value: 'En español' },
                        ].map((item) => (
                            <div key={item.label} className="text-center lg:text-left">
                                <p className="text-lg font-bold text-white sm:text-xl">{item.value}</p>
                                <p className="mt-0.5 text-xs text-slate-400">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Funcionalidades */}
            <section id="funcionalidades" className="scroll-mt-20 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Funcionalidades</h2>
                        <p className="mt-4 text-base text-muted-foreground">
                            Todo lo que necesitas para llevar la parte financiera de tu negocio, sin conectar sistemas sueltos.
                        </p>
                        <Link href="/funcionalidades" className="mt-4 inline-block text-sm font-medium text-brand-1 hover:underline">
                            Ver todas las funcionalidades en detalle →
                        </Link>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FUNCIONALIDADES.map((item) => (
                            <div key={item.title} className="rounded-xl border border-border p-6">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-1/10">
                                    <item.icon className="h-5 w-5 text-brand-1" />
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-brand-3">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cómo funciona */}
            <section id="como-funciona" className="scroll-mt-20 bg-secondary py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Cómo funciona</h2>
                        <p className="mt-4 text-base text-muted-foreground">De cero a tu primera factura, en cuatro pasos.</p>
                        <Link href="/como-funciona" className="mt-4 inline-block text-sm font-medium text-brand-1 hover:underline">
                            Ver el paso a paso completo →
                        </Link>
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
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{paso.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rubros */}
            <section id="rubros" className="scroll-mt-20 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Para tu tipo de negocio</h2>
                            <p className="mt-4 text-base text-muted-foreground">
                                Pensado para negocios panameños que facturan ante la DGI, sin importar el rubro.
                            </p>
                            <Link href="/rubros" className="mt-4 inline-block text-sm font-medium text-brand-1 hover:underline">
                                Ver todos los rubros en detalle →
                            </Link>
                        </div>
                        <dl className="divide-y divide-border border-t border-border">
                            {RUBROS.map((rubro) => (
                                <div key={rubro.title} className="flex items-start gap-5 py-6 first:pt-0">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-1/10">
                                        <rubro.icon className="h-5 w-5 text-brand-1" />
                                    </div>
                                    <div>
                                        <dt className="text-base font-semibold text-brand-3">{rubro.title}</dt>
                                        <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{rubro.description}</dd>
                                    </div>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </section>

            {/* Glosario */}
            <section id="glosario" className="scroll-mt-20 bg-secondary py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Glosario</h2>
                        <p className="mt-4 text-base text-muted-foreground">
                            Términos que todo dueño de negocio panameño necesita entender antes de facturar electrónicamente.
                        </p>
                        <Link href="/glosario" className="mt-4 inline-block text-sm font-medium text-brand-1 hover:underline">
                            Ver el glosario completo →
                        </Link>
                    </div>
                    <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
                        {GLOSARIO.map((item) => (
                            <div key={item.term} className="border-t border-border pt-4">
                                <dt className="font-mono text-sm font-semibold tracking-tight text-brand-1">{item.term}</dt>
                                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.def}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* Precios */}
            <section id="precios" className="scroll-mt-20 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-brand-3 sm:text-3xl">Precios</h2>
                        <p className="mt-4 text-base text-muted-foreground">Planes en dólares (USD), la moneda oficial de Panamá.</p>
                        <Link href="/precios" className="mt-4 inline-block text-sm font-medium text-brand-1 hover:underline">
                            Ver detalle de planes y preguntas frecuentes →
                        </Link>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
                                <h3 className="text-lg font-bold text-brand-3">{plan.name}</h3>
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

            {/* FAQ */}
            <section className="bg-secondary py-16 sm:py-24">
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
                    <p className="mt-4 text-base text-slate-300" /* design-token-exempt */>Crea tu cuenta gratis, sin tarjeta de crédito.</p>
                    <div className="mt-8">
                        <Button asChild size="lg" className="bg-white text-brand-3 hover:bg-slate-100" /* design-token-exempt */>
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
