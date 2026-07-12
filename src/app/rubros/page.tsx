import type { Metadata } from 'next';
import Link from 'next/link';
import { Store, Truck, Briefcase, UtensilsCrossed, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderInicio } from '@/components/inicio/HeaderInicio';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Rubros: ERP para comercio, distribuidoras, servicios y restaurantes | ERP Panamá',
    description:
        'ERP Panamá se adapta a comercio minorista, distribuidoras, servicios profesionales y restaurantes: facturación electrónica DGI, inventario y contabilidad para cada tipo de negocio.',
    alternates: { canonical: '/rubros' },
    openGraph: {
        title: 'Rubros que atiende ERP Panamá',
        description:
            'Pensado para negocios panameños que facturan ante la DGI, sin importar el rubro: comercio minorista, distribuidoras, servicios profesionales y restaurantes.',
        type: 'website',
        locale: 'es_PA',
        siteName: 'ERP Panamá',
    },
};

const RUBROS = [
    {
        icon: Store,
        title: 'Comercio minorista',
        description: 'Tiendas y puntos de venta que necesitan facturar e inventariar producto terminado.',
        detalles: [
            'Punto de venta (POS) para cobro rápido en caja.',
            'Control de inventario de producto terminado por sucursal.',
            'Facturación electrónica integrada al mismo flujo de venta, sin pasos adicionales.',
            'Reportes de ventas por producto y por sucursal para identificar qué se vende más y dónde.',
        ],
    },
    {
        icon: Truck,
        title: 'Distribuidoras',
        description: 'Control de compras, múltiples bodegas y cuentas por cobrar a mayor volumen.',
        detalles: [
            'Gestión de compras a proveedores, con su costo reflejado en el inventario.',
            'Múltiples bodegas y sucursales, con traslados de mercancía entre ellas.',
            'Cuentas por cobrar a mayor volumen, con antigüedad de saldos para priorizar cobranza.',
            'Lotes y fechas de vencimiento para mercancía perecedera o con caducidad.',
        ],
    },
    {
        icon: Briefcase,
        title: 'Servicios profesionales',
        description: 'Facturación de servicios sin inventario, con cotizaciones y cuentas por cobrar.',
        detalles: [
            'Cotizaciones que se convierten en factura electrónica sin volver a capturar datos.',
            'Facturación de servicios sin necesidad de manejar inventario ni bodegas.',
            'Seguimiento de cuentas por cobrar por cliente, con historial de pagos.',
            'Reportes de ingresos por servicio o por cliente para medir rentabilidad.',
        ],
    },
    {
        icon: UtensilsCrossed,
        title: 'Restaurantes',
        description: 'Punto de venta rápido con control de inventario de insumos y ventas del día.',
        detalles: [
            'Punto de venta ágil para mostrador o servicio en mesa.',
            'Control de inventario de insumos (materia prima), además del producto terminado.',
            'Cierre de caja diario con reporte de ventas del día.',
            'Facturación electrónica emitida desde el mismo punto de venta.',
        ],
    },
];

export default function RubrosPage() {
    return (
        <div className="min-h-screen bg-white">
            <HeaderInicio />

            <section className="bg-brand-3 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Para tu tipo de negocio</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        Pensado para negocios panameños que facturan ante la DGI, sin importar el rubro.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                        {RUBROS.map((rubro) => (
                            <div key={rubro.title} className="rounded-xl border border-border p-8">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-1/10">
                                    <rubro.icon className="h-6 w-6 text-brand-1" />
                                </div>
                                <h2 className="mt-4 text-lg font-bold text-brand-3">{rubro.title}</h2>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rubro.description}</p>
                                <ul className="mt-5 space-y-3">
                                    {rubro.detalles.map((detalle) => (
                                        <li key={detalle} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-1" />
                                            <span>{detalle}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
                        ¿No ves tu rubro exacto? ERP Panamá se adapta a cualquier negocio que necesite contabilidad,
                        facturación electrónica ante la DGI e inventario en un mismo sistema.{' '}
                        <Link href="/funcionalidades" className="font-medium text-brand-1 hover:underline">
                            Revisa todas las funcionalidades
                        </Link>
                        .
                    </p>
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
