'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    BookOpen,
    ShieldAlert,
    Key,
    DollarSign,
    Zap,
    ChevronDown,
    ChevronUp,
    FileText,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ResearchHubPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

    const categories = [
        { id: 'all', name: 'Todos' },
        { id: 'dgi', name: 'Integración DGI & PAC' },
        { id: 'billing', name: 'Planes & PayPal' },
        { id: 'catalog', name: 'Clientes & Productos' },
        { id: 'api', name: 'APIs & Webhooks' }
    ];

    const articles = [
        {
            id: 'dgi-cert',
            category: 'dgi',
            title: 'Configuración del Certificado Digital (.p12) en la DGI',
            summary: 'Aprende a subir, resguardar y actualizar tu certificado de firma electrónica digital en el sistema.',
            content: `El Certificado Digital de firma electrónica es un archivo con extensión .p12 o .pfx indispensable para firmar digitalmente cada documento que envías ante el PAC y la DGI.

Para configurarlo:
1. Ve a **Configuración > Integración DGI**.
2. Dirígete a la sección **2. Credenciales del PAC** y haz clic en "Seleccionar Archivo".
3. Carga tu archivo del certificado.
4. Digita la contraseña que te proveyó la entidad certificadora de firma digital.
5. Haz clic en **"Probar Conexión DGI"** para validar que la firma sea válida ante el PAC y la DGI en modo Sandbox.
6. Guarda los cambios.

*Nota:* Recuerda monitorear la fecha de expiración de tu certificado; las firmas digitales suelen tener una vigencia de 2 años en Panamá.`
        },
        {
            id: 'dgi-ambiente',
            category: 'dgi',
            title: 'Ambientes DGI: Pruebas (Piloto) vs Producción (Oficial)',
            summary: 'Conoce las diferencias críticas entre ambos ambientes de facturación y cómo activar tu flujo oficial.',
            content: `ERP Panamá opera en dos ambientes con el PAC integrado:
            
1. **Ambiente de Pruebas (Piloto):**
   * Emite facturas de simulación sin validez legal.
   * Útil para validar que tu secuenciación, catálogo de productos e ITBMS operan de forma correcta.
   * Se utiliza por defecto en el Plan Gratuito.
2. **Ambiente de Producción:**
   * Emite facturas reales, registradas oficialmente en la DGI y con validez fiscal.
   * Requiere credenciales de contribuyente reales, certificado digital activo y un plan de pago habilitado (Básico o Pro) para conectar con el PAC oficial.

Para cambiar a producción:
* Debes actualizar tu plan de facturación.
* En **Configuración > Integración DGI**, cambia el selector de ambiente a "Ambiente de Producción (Oficial)" y guarda los cambios.`
        },
        {
            id: 'billing-paypal',
            category: 'billing',
            title: 'Ciclos de Facturación y Renovación de PayPal',
            summary: 'Detalles de renovación, facturación mensual vs anual y métodos de pago permitidos en ERP Panamá.',
            content: `Nuestros planes se administran de forma segura a través de PayPal Vault para garantizar cobros recurrentes transparentes.

* **Facturación Mensual:** Se cobra de forma automática el mismo día de cada mes al saldo de tu tarjeta o cuenta PayPal.
* **Facturación Anual:** Te permite ahorrar un 17% del costo del servicio. Se realiza un único cargo anual y cubre 12 meses de servicio.
* **Costos Excedentes:** En planes de pago (Básico o Pro), si superas el límite mensual de documentos incluidos, cada factura extra se liquidará a un costo por consumo (Básico: $0.07 USD por factura adicional; Pro: $0.04 USD por factura adicional).`
        },
        {
            id: 'billing-cancel',
            category: 'billing',
            title: 'Cómo Cancelar tu Suscripción Recurrente',
            summary: 'Procedimiento de cancelación segura, impactos en tu cuenta y resguardo de datos históricos.',
            content: `Puedes dar de baja tu plan contratado en cualquier momento.

Para cancelar:
1. Ve a **Configuración > Planes y Facturación**.
2. En la tarjeta de tu Plan Actual, haz clic en el botón de **"Cancelar Suscripción"**.
3. Se abrirá un diálogo confirmando el impacto del cambio. Haz clic en "Confirmar Cancelación".

**¿Qué sucede al cancelar?**
* Tu cuenta bajará al plan Gratuito de forma automática.
* Tus límites mensuales se restablecerán a 10 documentos por mes.
* La firma digital y timbrado automático PAC se desactivará, volviendo al modo asistido/manual en ambiente de pruebas.
* Tus datos históricos de clientes, productos y facturas emitidas permanecen resguardados de forma segura en tu base de datos y no serán eliminados.`
        },
        {
            id: 'catalog-taxes',
            category: 'catalog',
            title: 'Gestión de Tasas del ITBMS para Panamá',
            summary: 'Tasas vigentes y cómo configurar correctamente los productos exentos y gravados (7%, 10%, 15%).',
            content: `ERP Panamá cuenta con el catálogo impositivo actualizado según las regulaciones fiscales vigentes en Panamá:

* **Tasa Exenta ("00"):** Aplicable a alimentos básicos, medicamentos y servicios exentos.
* **Tasa Regular ("01" - 7%):** Impuesto de Transferencia de Bienes Muebles y Servicios estándar.
* **Tasa Especial ("02" - 10%):** Aplicable a bebidas alcohólicas y hospedajes de hotel.
* **Tasa Especial ("03" - 15%):** Aplicable a productos de tabaco y derivados.

Al crear o editar productos:
1. Asigna el código de tasa ITBMS correspondiente.
2. El sistema calculará en tiempo real el precio con impuesto y el margen bruto en base al costo ingresado, facilitando el control de rentabilidad.`
        },
        {
            id: 'api-webhooks',
            category: 'api',
            title: 'Integración Avanzada de Webhooks Salientes',
            summary: 'Envía alertas y actualiza tu inventario en tiempo real conectando los webhooks de ERP Panamá.',
            content: `El plan Pro y Enterprise te permiten conectar tu sistema administrativo interno (ERP, WooCommerce, Shopify, etc.) mediante webhooks.

**Flujo de Webhooks:**
1. Ve a **Configuración > WhatsApp y APIs**.
2. Especifica tu URL de destino (ej. \`https://mi-tienda.com/api/webhooks/factura\`).
3. Ingresa tu firma secreta (Webhook Token) para autorizar las solicitudes.
4. Cada vez que una factura sea autorizada ante la DGI o anulada, ERP Panamá enviará un payload JSON con toda la metadata del CUFE, estado fiscal e ítems facturados para que puedas conciliar stock y sincronizar tus ventas de inmediato.`
        }
    ];

    const filteredArticles = articles.filter(art => {
        const matchesSearch = searchQuery === '' || 
            art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const toggleArticle = (id: string) => {
        if (expandedArticle === id) {
            setExpandedArticle(null);
        } else {
            setExpandedArticle(id);
        }
    };

    return (
        <>
            <Topbar title="Research Hub — Centro de Conocimiento" />
            <ContentContainer>
                <div className="mx-auto max-w-5xl space-y-8 font-sans">
                    
                    {/* Hero Header */}
                    <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-xl p-8 shadow-xl relative overflow-hidden">
                        <div className="relative z-10 max-w-2xl space-y-4">
                            <Badge className="bg-indigo-500/20 text-indigo-200 border-none font-bold uppercase tracking-wider text-[10px]">
                                Base de Conocimiento
                            </Badge>
                            <h2 className="text-3xl font-extrabold tracking-tight">Research Hub</h2>
                            <p className="text-sm text-indigo-100/80 leading-relaxed">
                                Explora manuales técnicos, guías de cumplimiento de facturación electrónica DGI y configuraciones avanzadas para tu negocio.
                            </p>
                        </div>
                        {/* Abstract background graphics */}
                        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 shrink-0">
                            <BookOpen className="h-72 w-72" />
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar artículos por palabra clave..."
                                className="pl-9 text-xs"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                        selectedCategory === cat.id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                            : 'bg-card border-border hover:bg-slate-50 text-muted-foreground'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Articles List */}
                    <div className="space-y-4">
                        {filteredArticles.length === 0 ? (
                            <Card className="text-center py-16 text-muted-foreground border-dashed">
                                <CardContent className="space-y-3">
                                    <BookOpen className="h-12 w-12 mx-auto opacity-40 text-slate-400" />
                                    <p className="font-semibold text-sm">No se encontraron artículos</p>
                                    <p className="text-xs">Prueba ajustando los filtros o cambiando tu búsqueda.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredArticles.map((art) => {
                                const isExpanded = expandedArticle === art.id;
                                return (
                                    <Card
                                        key={art.id}
                                        className={`transition-all duration-300 ${
                                            isExpanded ? 'ring-1 ring-indigo-500/20 shadow-md' : 'hover:shadow-sm'
                                        }`}
                                    >
                                        <button
                                            onClick={() => toggleArticle(art.id)}
                                            className="w-full text-left p-6 flex items-start justify-between gap-4 focus:outline-none"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded",
                                                        art.category === 'dgi' && "text-indigo-600 bg-indigo-50",
                                                        art.category === 'billing' && "text-amber-600 bg-amber-50",
                                                        art.category === 'catalog' && "text-emerald-600 bg-emerald-50",
                                                        art.category === 'api' && "text-blue-600 bg-blue-50"
                                                    )}>
                                                        {categories.find(c => c.id === art.category)?.name}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                                                    {art.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {art.summary}
                                                </p>
                                            </div>
                                            <div className="shrink-0 p-1 rounded-full bg-slate-50 border mt-1">
                                                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                                            </div>
                                        </button>
                                        
                                        {isExpanded && (
                                            <CardContent className="border-t px-6 py-5 bg-slate-50/50 leading-relaxed text-xs text-slate-700 whitespace-pre-wrap">
                                                {art.content}
                                            </CardContent>
                                        )}
                                    </Card>
                                );
                            })
                        )}
                    </div>

                    {/* Support Callout Banner */}
                    <Card className="bg-indigo-50/20 border-indigo-100">
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 px-8">
                            <div className="flex items-center gap-4 text-left">
                                <BookOpen className="h-8 w-8 text-indigo-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-950">¿No encuentras lo que buscas?</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Explora el canal de soporte técnico directamente en la barra lateral para levantar un ticket.
                                    </p>
                                </div>
                            </div>
                            <Link href="/help" className="shrink-0">
                                <Button className="text-xs font-semibold" variant="outline">
                                    Ver FAQs del Centro de Ayuda
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </ContentContainer>
        </>
    );
}
