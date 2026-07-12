import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Calculator,
    FileText,
    Landmark,
    Boxes,
    BarChart3,
    ArrowRight,
    CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderInicio } from '@/components/inicio/HeaderInicio';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Funcionalidades: Contabilidad, Facturación DGI e Inventario | ERP Panamá',
    description:
        'Conoce en detalle el motor contable automático, la facturación electrónica DGI, la conciliación bancaria, el inventario multi-almacén con FEFO y los reportes financieros de ERP Panamá.',
    alternates: { canonical: '/funcionalidades' },
    openGraph: {
        title: 'Funcionalidades de ERP Panamá',
        description:
            'Motor contable automático, facturación electrónica DGI, conciliación bancaria, inventario multi-almacén y reportes financieros en tiempo real.',
        type: 'website',
        locale: 'es_PA',
        siteName: 'ERP Panamá',
    },
};

const FUNCIONALIDADES = [
    {
        icon: Calculator,
        title: 'Motor contable automático',
        description:
            'Cada factura, cobro, compra y pago genera su asiento de partida doble automáticamente en tu Plan de Cuentas, sin capturar nada dos veces.',
        detalles: [
            'Plan de Cuentas configurable según la estructura de tu empresa.',
            'Asientos disparados automáticamente por cada documento: facturas, cobros, compras, pagos, notas de crédito y débito.',
            'Trazabilidad completa: cada asiento queda vinculado al documento que lo originó, para auditar en segundos.',
            'Libros contables actualizados en tiempo real, no solo al cierre de mes.',
        ],
    },
    {
        icon: FileText,
        title: 'Facturación electrónica DGI',
        description:
            'Emisión de facturas, notas de crédito y notas de débito con la numeración y estructura que exige la DGI.',
        detalles: [
            'Numeración y estructura fiscal alineadas a la normativa de facturación electrónica de la DGI.',
            'Estado del documento visible en todo momento: pendiente, autorizado o rechazado.',
            'Notas de crédito y débito enlazadas directamente a la factura original que las origina.',
            'Descarga del CAFE (Comprobante Auxiliar de Factura Electrónica) en PDF y XML.',
            'La integración con el PAC (Proveedor Autorizado de Calificación) está en preparación. Te avisaremos apenas esté disponible en producción.',
        ],
    },
    {
        icon: Landmark,
        title: 'Conciliación bancaria',
        description:
            'Importa el estado de cuenta de tu banco (CSV/Excel) y concilia cada movimiento contra tus asientos contables desde una sola pantalla.',
        detalles: [
            'Importación de movimientos bancarios desde archivos CSV o Excel.',
            'Conciliación línea por línea contra los asientos que el sistema ya generó.',
            'Identificación rápida de diferencias o movimientos pendientes de conciliar.',
            'Historial de conciliaciones por cada cuenta bancaria registrada.',
        ],
    },
    {
        icon: Boxes,
        title: 'Inventario multi-almacén con lotes y FEFO',
        description:
            'Controla stock por sucursal y bodega, con lotes y vencimientos que se descuentan automáticamente por FEFO (primero en vencer, primero en salir).',
        detalles: [
            'Múltiples sucursales y bodegas administradas dentro de una misma empresa.',
            'Seguimiento de lotes con fecha de vencimiento por producto.',
            'Descuento automático por FEFO al facturar o despachar mercancía, sin intervención manual.',
            'Visibilidad de stock disponible por bodega antes de confirmar una venta.',
        ],
    },
    {
        icon: BarChart3,
        title: 'Reportes financieros',
        description:
            'Libro diario, libro mayor, balance de comprobación, estado de resultados y balance general, generados en tiempo real desde tus propios asientos.',
        detalles: [
            'Dashboard de KPIs de ventas, cobros y cuentas por cobrar.',
            'Tendencia de ventas, ventas por estado, productos y clientes principales.',
            'Antigüedad de saldos (aging) de cuentas por cobrar para priorizar cobranza.',
            'Reportes de ventas por vendedor y detalle de cada factura individual.',
            'Todo calculado desde tus asientos reales, no desde una hoja de cálculo aparte.',
        ],
    },
];

export default function FuncionalidadesPage() {
    return (
        <div className="min-h-screen bg-white">
            <HeaderInicio />

            <section className="bg-brand-3 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Funcionalidades</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        Todo lo que necesitas para llevar la parte financiera de tu negocio, sin conectar sistemas sueltos.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-14">
                        {FUNCIONALIDADES.map((item) => (
                            <div key={item.title} className="grid grid-cols-1 gap-6 border-t border-border pt-10 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-12">
                                <div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-1/10">
                                        <item.icon className="h-6 w-6 text-brand-1" />
                                    </div>
                                    <h2 className="mt-4 text-xl font-bold text-brand-3">{item.title}</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                                </div>
                                <ul className="space-y-3 self-start">
                                    {item.detalles.map((detalle) => (
                                        <li key={detalle} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-1" />
                                            <span>{detalle}</span>
                                        </li>
                                    ))}
                                </ul>
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
