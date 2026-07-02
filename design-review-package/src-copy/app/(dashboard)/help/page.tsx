import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    HelpCircle,
    FileText,
    Settings,
    Users,
    Package,
    ShieldCheck,
    ArrowUpRight,
    MessageSquare,
    PhoneCall,
    Mail
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HelpPage() {
    const categories = [
        {
            title: 'Facturación Electrónica DGI',
            description: 'Aprende a integrar tu firma digital, sincronizar PAC y emitir facturas con timbrado automático.',
            icon: ShieldCheck,
            links: [
                { name: 'Cómo subir el Certificado Digital (.p12)', href: '#certificado' },
                { name: 'Qué es el CUFE y cómo se genera', href: '#cufe' },
                { name: 'Estados del documento ante la DGI', href: '#estados' },
            ]
        },
        {
            title: 'Gestión y Configuración',
            description: 'Configura tus datos de contribuyente, sucursales, cajas y secuencias numeradas.',
            icon: Settings,
            links: [
                { name: 'Configurar datos de Razón Social y DV', href: '#config-dv' },
                { name: 'Dar de alta múltiples sucursales y cajas', href: '#sucursales' },
                { name: 'Manejo de secuencias de numeración', href: '#secuencias' },
            ]
        },
        {
            title: 'Catálogos de Clientes y Productos',
            description: 'Administración rápida de tus contactos y catálogo de productos con impuestos de Panamá.',
            icon: Package,
            links: [
                { name: 'Impuestos aplicables (7%, 10%, 15%, Exento)', href: '#impuestos' },
                { name: 'Gestión de Stock mínimo y alertas', href: '#stock' },
                { name: 'Importación masiva de productos', href: '#importar' },
            ]
        }
    ];

    const faqs = [
        {
            q: '¿Cómo funciona el timbrado con el PAC?',
            a: 'Cuando emites una factura electrónica y tienes el PAC integrado en Configuración > Integración DGI, el sistema envía los datos automáticamente a la DGI para su autorización. Una vez autorizada, la DGI retorna el código CUFE y el código QR oficial, que se adjuntan al PDF y XML que se envían a tu cliente.'
        },
        {
            q: '¿Cuál es la diferencia entre el ambiente de Pruebas y Producción?',
            a: 'El ambiente de Pruebas (Piloto) se utiliza para emitir facturas ficticias para verificar que tu conexión DGI y PAC funcionen correctamente. El ambiente de Producción emite facturas oficiales con validez legal. Nota: Habilitar producción requiere un plan de pago (Básico o Pro).'
        },
        {
            q: '¿Qué sucede si llego al límite mensual de facturas de mi plan?',
            a: 'Si llegas al límite de facturas mensuales de tu plan (ej. 10 facturas en Gratuito o 500 en Pro), el sistema te notificará. Para continuar emitiendo facturas automáticas, puedes actualizar tu plan desde Configuración > Planes y Facturación o pagar un costo por factura excedente si tienes un plan de pago activo.'
        },
        {
            q: '¿Cómo puedo cancelar mi suscripción activa?',
            a: 'Puedes cancelar tu plan en cualquier momento desde Configuración > Planes y Facturación. Al hacer clic en "Cancelar Suscripción", tu cuenta bajará al plan Gratuito de forma automática al finalizar tu ciclo de facturación y se detendrá la renovación automática de PayPal.'
        }
    ];

    return (
        <>
            <Topbar title="Centro de Ayuda" />
            <ContentContainer>
                <div className="mx-auto max-w-5xl space-y-8 font-sans">
                    {/* Header Banner */}
                    <div className="text-center py-8 space-y-3 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/50 rounded-xl border p-6">
                        <div className="h-12 w-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto">
                            <HelpCircle className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">¿Cómo podemos ayudarte?</h2>
                        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                            Encuentra guías paso a paso, respuestas a preguntas frecuentes o ponte en contacto con nuestro equipo de soporte técnico para ayudarte en tu facturación.
                        </p>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid gap-6 md:grid-cols-3">
                        {categories.map((cat, idx) => {
                            const Icon = cat.icon;
                            return (
                                <Card key={idx} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="h-10 w-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center mb-3">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-lg">{cat.title}</CardTitle>
                                        <CardDescription className="text-xs leading-relaxed min-h-[50px]">
                                            {cat.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-end pt-0">
                                        <div className="border-t pt-4 space-y-2">
                                            {cat.links.map((link, lIdx) => (
                                                <a
                                                    key={lIdx}
                                                    href={link.href}
                                                    className="group flex items-center justify-between text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                                >
                                                    <span>{link.name}</span>
                                                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid gap-8 md:grid-cols-3 pt-4">
                        {/* FAQs Section */}
                        <div className="md:col-span-2 space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-600" />
                                Preguntas Frecuentes (FAQs)
                            </h3>
                            <div className="space-y-4">
                                {faqs.map((faq, idx) => (
                                    <div key={idx} className="border rounded-lg p-5 bg-card shadow-sm space-y-2">
                                        <h4 className="text-sm font-semibold text-slate-900">{faq.q}</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Support Sidebar */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <PhoneCall className="h-5 w-5 text-indigo-600" />
                                Canales de Soporte
                            </h3>
                            <Card className="border-indigo-100 bg-indigo-50/10">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base">Soporte Técnico Directo</CardTitle>
                                    <CardDescription className="text-xs">
                                        ¿No encuentras la solución? Levanta un ticket o contáctanos por nuestros canales oficiales.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="h-8 w-8 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center shrink-0">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Correo de Soporte</p>
                                            <p className="text-muted-foreground">soporte@erppanama.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="h-8 w-8 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center shrink-0">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Soporte Express</p>
                                            <p className="text-muted-foreground">Disponible vía menú de usuario</p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
                                            Recuerda que también puedes abrir un ticket de soporte directamente haciendo clic en tu foto de perfil en la barra lateral izquierda y seleccionando **"Contactar soporte"**.
                                        </p>
                                        <Link href="/settings" className="w-full">
                                            <Button className="w-full text-xs font-semibold" variant="outline">
                                                Configurar DGI / PAC
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </ContentContainer>
        </>
    );
}
