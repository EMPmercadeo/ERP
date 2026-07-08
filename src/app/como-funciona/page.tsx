import type { Metadata } from 'next';
import Link from 'next/link';
import { UserPlus, Building2, Package, Receipt, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderInicio } from '@/components/inicio/HeaderInicio';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Cómo funciona — De cero a tu primera factura | ERP Panamá',
    description:
        'De cero a tu primera factura electrónica en cuatro pasos: crea tu cuenta, configura tu sucursal y caja, carga tus productos y emite tu primera factura con contabilidad e inventario ya conectados.',
    alternates: { canonical: '/como-funciona' },
    openGraph: {
        title: 'Cómo funciona ERP Panamá',
        description: 'De cero a tu primera factura, en cuatro pasos.',
        type: 'website',
        locale: 'es_PA',
        siteName: 'ERP Panamá',
    },
};

const PASOS = [
    {
        icon: UserPlus,
        title: 'Crea tu cuenta',
        description: 'Regístrate con tu correo o con Google. Sin tarjeta de crédito para empezar.',
        detalles: [
            'Registro con correo y contraseña, o con tu cuenta de Google.',
            'No se pide tarjeta de crédito para crear la cuenta ni para probar el sistema.',
            'Acceso inmediato al panel apenas confirmas tu correo.',
        ],
    },
    {
        icon: Building2,
        title: 'Configura tu sucursal y caja',
        description: 'Creamos automáticamente tu primera sucursal, caja y bodega para que empieces a operar de inmediato.',
        detalles: [
            'Sucursal principal, caja y bodega creadas automáticamente al registrarte.',
            'Puedes agregar sucursales, cajas y bodegas adicionales más adelante, según crezca tu negocio.',
            'Datos fiscales de tu empresa (RUC, DV, razón social) configurables desde el primer momento.',
        ],
    },
    {
        icon: Package,
        title: 'Carga tus productos',
        description: 'Agrega tu catálogo manualmente o impórtalo desde Excel/CSV en minutos.',
        detalles: [
            'Alta manual de productos y servicios, uno por uno, con sus datos completos.',
            'Importación masiva desde Excel/CSV para catálogos grandes.',
            'Definición de precios, impuestos y control de inventario por producto.',
        ],
    },
    {
        icon: Receipt,
        title: 'Emite tu primera factura',
        description: 'Factura a tus clientes con el control de inventario y la contabilidad ya conectados por debajo.',
        detalles: [
            'Selección de cliente, productos o servicios y forma de pago en un mismo flujo.',
            'El asiento contable y el descuento de inventario ocurren automáticamente al confirmar la factura.',
            'Descarga del CAFE en PDF/XML o envío directo por correo o WhatsApp.',
        ],
    },
];

export default function ComoFuncionaPage() {
    return (
        <div className="min-h-screen bg-white">
            <HeaderInicio />

            <section className="bg-brand-3 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Cómo funciona</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        De cero a tu primera factura, en cuatro pasos.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-12">
                        {PASOS.map((paso, index) => (
                            <div key={paso.title} className="flex gap-6">
                                <div className="flex flex-col items-center">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-1 text-white">
                                        <paso.icon className="h-6 w-6" />
                                    </div>
                                    {index < PASOS.length - 1 && <div className="mt-2 h-full w-px flex-1 bg-border" />}
                                </div>
                                <div className="pb-2">
                                    <span className="block text-xs font-bold uppercase tracking-wider text-brand-1">
                                        Paso {index + 1}
                                    </span>
                                    <h2 className="mt-1 text-lg font-bold text-brand-3">{paso.title}</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{paso.description}</p>
                                    <ul className="mt-4 space-y-2">
                                        {paso.detalles.map((detalle) => (
                                            <li key={detalle} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-1" />
                                                <span>{detalle}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
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
