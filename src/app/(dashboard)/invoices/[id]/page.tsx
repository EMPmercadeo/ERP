import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
import {
    ArrowLeft,
    Printer,
    Download,
    Mail,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ContentContainer } from '@/components/layout/Content';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage(props: PageProps) {
    const params = await props.params;
    const { id } = params;

    const invoice = await prisma.factura.findFirst({
        where: {
            OR: [
                { id: id },
                { numeroCompleto: id }
            ]
        },
        include: {
            cliente: true,
            items: {
                include: {
                    producto: true
                }
            },
            pagos: true,
            sucursal: true,
            creador: true
        }
    });

    if (!invoice) {
        notFound();
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aceptada': return 'bg-green-500 hover:bg-green-600';
            case 'rechazada': return 'bg-red-500 hover:bg-red-600';
            case 'pendiente': return 'bg-yellow-500 hover:bg-yellow-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const getPaymentStatusColor = (balance: number, total: number) => {
        if (balance === 0) return 'bg-green-100 text-green-800';
        if (balance === total) return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    const getPaymentStatusLabel = (balance: number, total: number) => {
        if (balance === 0) return 'Pagada';
        if (balance === total) return 'Pendiente';
        return 'Parcial';
    };

    return (
        <ContentContainer>
            <div className="flex flex-col space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/invoices">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Factura {invoice.numeroCompleto || 'Borrador'}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {format(invoice.fechaEmision, "d 'de' MMMM, yyyy", { locale: es })}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                        <Button variant="outline" size="sm">
                            <Mail className="mr-2 h-4 w-4" />
                            Enviar
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Invoice Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Client & Company Info */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">De</h3>
                                        <div className="font-semibold text-lg">Tu Empresa S.A.</div>
                                        <div className="text-sm text-muted-foreground">
                                            {invoice.sucursal?.direccion}<br />
                                            {invoice.sucursal?.nombre}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Para</h3>
                                        <div className="font-semibold text-lg">{invoice.cliente.razonSocial}</div>
                                        <div className="text-sm text-muted-foreground">
                                            RUC: {invoice.cliente.ruc}-{invoice.cliente.dv}<br />
                                            {invoice.cliente.email}<br />
                                            {invoice.cliente.telefono}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalles de Factura</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Cant.</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{Number(item.cantidad)}</TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{item.descripcion}</span>
                                                </TableCell>
                                                <TableCell className="text-right">${Number(item.precioUnitario).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">${Number(item.montoTotal).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        {/* Totals Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${Number(invoice.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Descuento</span>
                                    <span>-${Number(invoice.totalDescuento).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">ITBMS</span>
                                    <span>${Number(invoice.totalItbms).toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${Number(invoice.totalNeto).toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Estado</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">DGI (Factura Electrónica)</div>
                                    <Badge className={getStatusColor(invoice.estadoDgi)}>
                                        {invoice.estadoDgi.toUpperCase()}
                                    </Badge>
                                    {invoice.cufe && (
                                        <div className="mt-2 text-xs text-muted-foreground break-all font-mono bg-muted p-2 rounded">
                                            CUFE: {invoice.cufe}
                                        </div>
                                    )}
                                </div>
                                <Separator />
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Pago</div>
                                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getPaymentStatusColor(Number(invoice.saldoPendiente), Number(invoice.totalNeto))}`}>
                                        {getPaymentStatusLabel(Number(invoice.saldoPendiente), Number(invoice.totalNeto))}
                                    </div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        Pendiente: ${Number(invoice.saldoPendiente).toFixed(2)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ContentContainer>
    );
}
