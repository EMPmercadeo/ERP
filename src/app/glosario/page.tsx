import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderInicio } from '@/components/inicio/HeaderInicio';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Glosario de facturación electrónica en Panamá (DGI, PAC, CAFE, RUC) | ERP Panamá',
    description:
        'Términos clave de facturación electrónica en Panamá explicados: DGI, Factura Electrónica, PAC, CAFE, RUC, DV y Autorización DGI — qué significan y por qué importan para tu negocio.',
    alternates: { canonical: '/glosario' },
    openGraph: {
        title: 'Glosario de facturación electrónica en Panamá',
        description:
            'Términos que todo dueño de negocio panameño necesita entender antes de facturar electrónicamente.',
        type: 'website',
        locale: 'es_PA',
        siteName: 'ERP Panamá',
    },
};

const GLOSARIO = [
    {
        term: 'DGI',
        def: 'Dirección General de Ingresos — la autoridad fiscal de Panamá, encargada de recaudar impuestos y regular la facturación electrónica.',
        extra: 'Es la entidad ante la que, a través de un PAC, se validan y autorizan tus documentos fiscales electrónicos.',
    },
    {
        term: 'Factura Electrónica',
        def: 'Documento fiscal digital, con una estructura y firma definidas por la DGI, que reemplaza a la factura de papel para efectos legales y tributarios.',
        extra: 'Debe emitirse con la numeración, el formato y la firma que exige la normativa vigente para tener validez fiscal.',
    },
    {
        term: 'PAC',
        def: 'Proveedor Autorizado de Calificación — empresa autorizada por la DGI para validar y calificar tus facturas electrónicas antes de que tengan validez fiscal.',
        extra: 'Sin la calificación del PAC, una factura generada por tu sistema todavía no es válida ante la DGI.',
    },
    {
        term: 'CAFE',
        def: 'Comprobante Auxiliar de Factura Electrónica — la representación impresa o en PDF de una factura electrónica, para entregar al cliente.',
        extra: 'No reemplaza a la factura electrónica en sí; es la versión legible que le entregas a tu cliente en papel o PDF.',
    },
    {
        term: 'RUC',
        def: 'Registro Único de Contribuyente — el número que identifica fiscalmente a una persona o empresa ante la DGI.',
        extra: 'Es obligatorio tanto para emitir como para recibir facturas electrónicas válidas.',
    },
    {
        term: 'DV',
        def: 'Dígito Verificador — un dígito adicional al RUC que sirve para validar que el número es correcto.',
        extra: 'Se usa junto al RUC para confirmar que el número no tiene errores de digitación al facturar.',
    },
    {
        term: 'Autorización (DGI)',
        def: 'El permiso que otorga la DGI, a través del PAC, para que una factura electrónica sea válida fiscalmente.',
        extra: 'Una factura sin autorización de la DGI no tiene validez tributaria, aunque ya se le haya entregado al cliente.',
    },
];

export default function GlosarioPage() {
    return (
        <div className="min-h-screen bg-white">
            <HeaderInicio />

            <section className="bg-brand-3 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Glosario</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                        Términos que todo dueño de negocio panameño necesita entender antes de facturar electrónicamente.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <dl className="divide-y divide-border border-t border-border">
                        {GLOSARIO.map((item) => (
                            <div key={item.term} className="py-8 first:pt-0">
                                <dt className="font-mono text-base font-semibold tracking-tight text-brand-1">{item.term}</dt>
                                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.def}</dd>
                                <dd className="mt-2 text-sm leading-relaxed text-foreground/70">{item.extra}</dd>
                            </div>
                        ))}
                    </dl>
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
