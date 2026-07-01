'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    User,
    CheckCircle2,
    DollarSign,
    Play
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { invoiceGroupedDeliveryNotes } from '@/lib/actions/delivery-notes';

interface DeliveryNoteDetailProps {
    note: {
        id: string;
        numero: string;
        fechaEmision: string;
        estado: string;
        subtotal: number;
        totalDescuento: number;
        totalItbms: number;
        totalNeto: number;
        observaciones: string;
        cliente: {
            id: string;
            razonSocial: string;
            ruc: string;
            dv: string;
            email: string;
            telefono: string;
            direccion: string;
        };
        creador: {
            nombre: string;
        };
        items: Array<{
            id: string;
            descripcion: string;
            cantidad: number;
            precioUnitario: number;
            descuento: number;
            montoItbms: number;
            montoTotal: number;
        }>;
        factura: {
            id: string;
            numeroCompleto: string | null;
        } | null;
    };
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function DeliveryNoteDetailClient({ note }: DeliveryNoteDetailProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleFacturar = async () => {
        setLoading(true);
        try {
            const res = await invoiceGroupedDeliveryNotes([note.id]);
            if (res.success) {
                toast.success(res.message);
                router.refresh();
            } else {
                toast.error(res.message || 'Error al generar la factura.');
            }
        } catch (e: any) {
            toast.error('Error de red al facturar el albarán.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Topbar title={`Albarán ${note.numero}`} />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Back link */}
                    <div className="flex items-center justify-between">
                        <Link href="/delivery-notes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Volver a Albaranes
                        </Link>
                        {note.estado !== 'facturado' && (
                            <Button 
                                onClick={handleFacturar} 
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm"
                            >
                                <DollarSign className="h-4.5 w-4.5" />
                                {loading ? 'Facturando...' : 'Convertir a Factura'}
                            </Button>
                        )}
                    </div>

                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-brand-1/10 text-brand-1 flex items-center justify-center font-bold text-xl">
                                ALB
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold text-slate-900">Albarán {note.numero}</h1>
                                    <StatusBadge status={note.estado} />
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Cliente: {note.cliente.razonSocial} (RUC: {note.cliente.ruc}{note.cliente.dv ? `-${note.cliente.dv}` : ''})
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side: General Info & Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Información de Entrega</CardTitle>
                                    <CardDescription>Detalles logísticos y fiscales</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-2.5">
                                            <User className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Cliente</span>
                                                <Link href={`/clients/${note.cliente.id}`} className="text-brand-1 font-semibold hover:underline">
                                                    {note.cliente.razonSocial}
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <Phone className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Teléfono Cliente</span>
                                                <span className="text-slate-800 font-medium">{note.cliente.telefono || 'No registrado'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <Mail className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Correo Cliente</span>
                                                <span className="text-slate-800 font-medium">{note.cliente.email || 'No registrado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-2.5">
                                            <MapPin className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Dirección de Entrega</span>
                                                <span className="text-slate-800 font-medium">{note.cliente.direccion || 'No registrada'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <Calendar className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Fecha de Emisión</span>
                                                <span className="text-slate-800 font-medium">{formatDate(note.fechaEmision)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <User className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Responsable / Creador</span>
                                                <span className="text-slate-800 font-medium">{note.creador.nombre}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                {note.observaciones && (
                                    <CardContent className="border-t pt-4">
                                        <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Observaciones</span>
                                        <p className="text-slate-700 text-sm whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">{note.observaciones}</p>
                                    </CardContent>
                                )}
                            </Card>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>Artículos Entregados</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Descripción del Producto</TableHead>
                                                <TableHead className="text-right">Cantidad</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {note.items.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                    <TableCell className="text-right">{item.cantidad}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatCurrency(item.cantidad * item.precioUnitario)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Side: Invoice Link & History */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalles del Cargo</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span className="font-semibold">{formatCurrency(note.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Descuento:</span>
                                        <span>-{formatCurrency(note.totalDescuento)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">ITBMS:</span>
                                        <span className="font-semibold">{formatCurrency(note.totalItbms)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between text-base font-bold text-slate-800">
                                        <span>Total Neto:</span>
                                        <span className="text-brand-1">{formatCurrency(note.totalNeto)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial del Documento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative pl-6 border-l space-y-4">
                                        <div className="relative">
                                            <div className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-primary" />
                                            <p className="text-xs font-bold text-primary">Creado y Entregado</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(note.fechaEmision)}</p>
                                        </div>

                                        {note.estado === 'facturado' && note.factura ? (
                                            <div className="relative">
                                                <div className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-600 bg-emerald-600" />
                                                <p className="text-xs font-bold text-emerald-600">Facturado</p>
                                                <Link 
                                                    href={`/invoices/${note.factura.id}`} 
                                                    className="text-xs font-semibold text-brand-1 hover:underline block mt-0.5"
                                                >
                                                    Ver Factura {note.factura.numeroCompleto || 'Emitida'}
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="relative text-muted-foreground">
                                                <div className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-300 bg-white" />
                                                <p className="text-xs font-bold">Pendiente de Facturación</p>
                                                <p className="text-[10px]">El documento aún no ha sido convertido en factura fiscal de venta.</p>
                                            </div>
                                        )}
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
