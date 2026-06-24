import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Download, Send } from 'lucide-react';
import Link from 'next/link';
import { QuotePDFDownloadButton } from '@/components/quotes/QuotePDFDownloadButton';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getQuote(id: string, empresaId: string) {
    const quote = await prisma.cotizacion.findFirst({
        where: { id, empresaId },
        include: {
            cliente: true,
            items: true,
            empresa: true // Needed for PDF info
        }
    });

    if (!quote) return null;
    return quote;
}

export default async function QuoteDetailPage(props: PageProps) {
    // Next.js 15 requires awaiting params
    const params = await props.params;
    const { id } = params;
    const { empresaId } = await getTenantContext();
    const rawQuote = await getQuote(id, empresaId);

    if (!rawQuote) {
        notFound();
    }

    // Serialize Decimal fields to numbers for Client Component compatibility
    const quote = {
        ...rawQuote,
        subtotal: Number(rawQuote.subtotal),
        totalDescuento: Number(rawQuote.totalDescuento),
        totalItbms: Number(rawQuote.totalItbms),
        totalNeto: Number(rawQuote.totalNeto),
        cliente: {
            ...rawQuote.cliente,
            limiteCredito: Number(rawQuote.cliente.limiteCredito),
            saldoPendiente: Number(rawQuote.cliente.saldoPendiente),
            saldoAFavor: Number(rawQuote.cliente.saldoAFavor),
        },
        items: rawQuote.items.map(item => ({
            ...item,
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
            descuento: Number(item.descuento),
            montoItbms: Number(item.montoItbms),
            montoTotal: Number(item.montoTotal),
        }))
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-PA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number | any) => {
        return Number(amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    // Map status to badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aceptada': return 'bg-green-500';
            case 'enviada': return 'bg-blue-500';
            case 'rechazada': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <>
            <Topbar>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                            <Link href="/quotes">
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <h1 className="text-xl font-semibold text-foreground">
                            Cotización {quote.numero}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <QuotePDFDownloadButton quote={quote} />
                        <Button variant="outline">
                            <Send className="mr-2 h-4 w-4" />
                            Enviar
                        </Button>
                    </div>
                </div>
            </Topbar>
            <ContentContainer>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status & Info */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold">Información General</CardTitle>
                                <Badge className={getStatusColor(quote.estado) + " capitalize"}>
                                    {quote.estado}
                                </Badge>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Fecha de Emisión</p>
                                    <p>{formatDate(quote.fechaEmision)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Válida Hasta</p>
                                    <p>{formatDate(quote.validaHasta)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Vendedor</p>
                                    <p>Usuario Demo</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Cliente</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-lg font-medium">{quote.cliente.razonSocial}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="font-semibold">RUC:</span> {quote.cliente.ruc}-{quote.cliente.dv}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Teléfono:</span> {quote.cliente.telefono || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Email:</span> {quote.cliente.email || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Dirección:</span> {quote.cliente.direccion || 'N/A'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Descripción</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Cant.</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Precio</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Desc%</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {quote.items.map((item) => (
                                                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">{item.descripcion}</td>
                                                    <td className="p-4 align-middle text-center">{Number(item.cantidad)}</td>
                                                    <td className="p-4 align-middle text-right">{formatCurrency(item.precioUnitario)}</td>
                                                    <td className="p-4 align-middle text-right">{Number(item.descuento)}%</td>
                                                    <td className="p-4 align-middle text-right font-medium">{formatCurrency(item.montoTotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Totals */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(quote.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Descuento</span>
                                        <span className="text-destructive">-{formatCurrency(quote.totalDescuento)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">ITBMS</span>
                                        <span>{formatCurrency(quote.totalItbms)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{formatCurrency(quote.totalNeto)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ContentContainer>
        </>
    );
}
