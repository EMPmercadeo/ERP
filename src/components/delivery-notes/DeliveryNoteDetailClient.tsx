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
    Printer,
    Ban,
    ChevronRight,
    FileCheck
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { invoiceGroupedDeliveryNotes, updateDeliveryNoteStatus } from '@/lib/actions/delivery-notes';

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
        observaciones: string; // client notes
        direccionEntrega: string;
        nombreContacto: string;
        telefonoContacto: string;
        fechaEstimadaEntrega: string | null;
        fechaRealEntrega: string | null;
        notasInternas: string;
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
        responsable: {
            nombre: string;
        } | null;
        cotizacion: {
            id: string;
            numero: string;
        } | null;
        items: Array<{
            id: string;
            descripcion: string;
            cantidad: number; // quantity delivered
            cantidadPedida: number;
            cantidadPendiente: number;
            precioUnitario: number;
            descuento: number;
            montoItbms: number;
            montoTotal: number;
        }>;
        factura: {
            id: string;
            numeroCompleto: string | null;
        } | null;
        historialEstados: Array<{
            id: string;
            estadoAnterior: string;
            estadoNuevo: string;
            fechaCambio: string;
            notas: string;
            usuario: {
                nombre: string;
            };
        }>;
    };
    printMode?: boolean;
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

function getEstadoLabel(estado: string) {
    switch (estado) {
        case 'borrador': return 'Borrador';
        case 'pendiente': return 'Pendiente';
        case 'parcialmente_entregado': return 'Parcialmente Entregado';
        case 'entregado': return 'Entregado';
        case 'facturado': return 'Facturado';
        case 'anulado': return 'Anulado';
        default: return estado;
    }
}

export function DeliveryNoteDetailClient({ note, printMode = false }: DeliveryNoteDetailProps) {
    const router = useRouter();
    const [actionLoading, setActionLoading] = useState(false);

    const handleFacturar = async () => {
        setActionLoading(true);
        try {
            const res = await invoiceGroupedDeliveryNotes([note.id]);
            if (res.success) {
                toast.success(res.message);
                router.refresh();
            } else {
                toast.error(res.message || 'Error al generar la factura.');
            }
        } catch (e: any) {
            toast.error('Error de red al facturar el documento.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setActionLoading(true);
        try {
            const res = await updateDeliveryNoteStatus(note.id, newStatus);
            if (res.success) {
                toast.success(`Estado actualizado a ${getEstadoLabel(newStatus)}.`);
                router.refresh();
            } else {
                toast.error(res.message || 'Error al actualizar estado.');
            }
        } catch (e) {
            toast.error('Error de red al actualizar el estado.');
        } finally {
            setActionLoading(false);
        }
    };

    // Printable minimal template
    if (printMode) {
        return (
            <div className="p-8 max-w-4xl mx-auto bg-white text-slate-800 space-y-6">
                <div className="flex justify-between items-start border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-brand-1">NOTA DE ENTREGA</h1>
                        <p className="text-sm font-semibold text-muted-foreground mt-1">Número: {note.numero}</p>
                        <p className="text-xs text-muted-foreground">Fecha Emisión: {formatDate(note.fechaEmision)}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold">ERP Panamá S.A.</h2>
                        <p className="text-xs text-muted-foreground">RUC: 12345-6-7890 DV 12</p>
                        <p className="text-xs text-muted-foreground">Vía España, Ciudad de Panamá</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 border-b pb-6 text-sm">
                    <div>
                        <h3 className="font-bold text-muted-foreground uppercase text-xs mb-2">Entregar A:</h3>
                        <p className="font-bold text-base">{note.cliente.razonSocial}</p>
                        <p className="text-xs">RUC: {note.cliente.ruc}{note.cliente.dv ? `-${note.cliente.dv}` : ''}</p>
                        <p className="mt-2"><span className="font-semibold">Dirección:</span> {note.direccionEntrega || note.cliente.direccion}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-muted-foreground uppercase text-xs mb-2">Detalles Logísticos:</h3>
                        {note.nombreContacto && <p><span className="font-semibold">Contacto:</span> {note.nombreContacto}</p>}
                        {note.telefonoContacto && <p><span className="font-semibold">Teléfono:</span> {note.telefonoContacto}</p>}
                        {note.fechaEstimadaEntrega && <p><span className="font-semibold">Fecha Est. Entrega:</span> {formatDate(note.fechaEstimadaEntrega)}</p>}
                        {note.responsable && <p><span className="font-semibold">Responsable:</span> {note.responsable.nombre}</p>}
                        {note.cotizacion && <p><span className="font-semibold">Cotización Asoc.:</span> #{note.cotizacion.numero}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Artículos / Servicios Entregados</h3>
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                                <th className="p-2.5">Descripción</th>
                                <th className="p-2.5 text-right w-28">Cant. Solicitada</th>
                                <th className="p-2.5 text-right w-28">Cant. Entregada</th>
                                <th className="p-2.5 text-right w-24">Pendiente</th>
                                <th className="p-2.5 text-right w-32">Precio Unitario</th>
                                <th className="p-2.5 text-right w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {note.items.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-2.5 font-medium">{item.descripcion}</td>
                                    <td className="p-2.5 text-right">{item.cantidadPedida}</td>
                                    <td className="p-2.5 text-right font-bold text-slate-900">{item.cantidad}</td>
                                    <td className="p-2.5 text-right text-amber-600">{item.cantidadPendiente}</td>
                                    <td className="p-2.5 text-right">{formatCurrency(item.precioUnitario)}</td>
                                    <td className="p-2.5 text-right font-semibold">{formatCurrency(item.cantidadPedida * item.precioUnitario)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-start pt-6 text-sm">
                    <div className="w-1/2 space-y-2">
                        {note.observaciones && (
                            <div>
                                <h4 className="font-bold text-xs uppercase text-muted-foreground">Notas al Cliente:</h4>
                                <p className="text-slate-600 italic mt-1">{note.observaciones}</p>
                            </div>
                        )}
                        <div className="pt-12 flex gap-8">
                            <div className="w-48 text-center border-t pt-2">
                                <p className="text-xs font-semibold">Firma de Recibido</p>
                                <p className="text-[10px] text-muted-foreground">Nombre y RUC</p>
                            </div>
                            <div className="w-48 text-center border-t pt-2">
                                <p className="text-xs font-semibold">Entregado por</p>
                                <p className="text-[10px] text-muted-foreground">Firma y Cédula</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-1/3 text-right space-y-2 font-medium">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(note.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-red-600">
                            <span>Descuento:</span>
                            <span>-{formatCurrency(note.totalDescuento)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>ITBMS (7%):</span>
                            <span>{formatCurrency(note.totalItbms)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between text-base font-bold text-brand-1">
                            <span>Total Neto:</span>
                            <span>{formatCurrency(note.totalNeto)}</span>
                        </div>
                    </div>
                </div>

                <script dangerouslySetInnerHTML={{ __html: 'window.print()' }} />
            </div>
        );
    }

    return (
        <>
            <Topbar title={`Detalle de Nota de Entrega ${note.numero}`} />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Actions bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <Link href="/delivery-notes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Volver a Notas de Entrega
                        </Link>
                        
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() => window.open(`?print=true`, '_blank')}
                                className="gap-2 border-slate-200 hover:bg-slate-50"
                            >
                                <Printer className="h-4 w-4" />
                                Imprimir / PDF
                            </Button>

                            {note.estado === 'borrador' && (
                                <Button
                                    onClick={() => handleUpdateStatus('pendiente')}
                                    disabled={actionLoading}
                                    className="bg-brand-1 text-white hover:bg-brand-1/90 gap-2 font-semibold shadow-sm"
                                >
                                    <FileCheck className="h-4.5 w-4.5" />
                                    Aprobar Nota (Pendiente)
                                </Button>
                            )}

                            {(note.estado === 'pendiente' || note.estado === 'parcialmente_entregado') && (
                                <>
                                    <Button
                                        onClick={() => handleUpdateStatus('entregado')}
                                        disabled={actionLoading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm"
                                    >
                                        <CheckCircle2 className="h-4.5 w-4.5" />
                                        Completar Entrega
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleUpdateStatus('anulado')}
                                        disabled={actionLoading}
                                        className="gap-2"
                                    >
                                        <Ban className="h-4 w-4" />
                                        Anular
                                    </Button>
                                </>
                            )}

                            {note.estado === 'entregado' && (
                                <Button 
                                    onClick={handleFacturar} 
                                    disabled={actionLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm"
                                >
                                    <DollarSign className="h-4.5 w-4.5" />
                                    Convertir a Factura
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-brand-1/10 text-brand-1 flex items-center justify-center font-bold text-xl">
                                NDE
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold text-slate-900">Nota de Entrega {note.numero}</h1>
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
                                    <CardTitle>Información de Envío y Logística</CardTitle>
                                    <CardDescription>Detalles de entrega y responsables</CardDescription>
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
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Contacto Entrega</span>
                                                <span className="text-slate-800 font-medium">
                                                    {note.nombreContacto || 'No especificado'} {note.telefonoContacto ? `(${note.telefonoContacto})` : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <Mail className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Correo Cliente</span>
                                                <span className="text-slate-800 font-medium">{note.cliente.email || 'No registrado'}</span>
                                            </div>
                                        </div>
                                        {note.cotizacion && (
                                            <div className="flex items-start gap-2.5">
                                                <FileText className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Cotización Vinculada</span>
                                                    <Link href={`/quotes/${note.cotizacion.id}`} className="text-brand-1 font-semibold hover:underline">
                                                        #{note.cotizacion.numero}
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-2.5">
                                            <MapPin className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Dirección de Entrega</span>
                                                <span className="text-slate-800 font-medium">{note.direccionEntrega || note.cliente.direccion || 'Dirección de oficina principal'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <Calendar className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Fecha Est. Entrega</span>
                                                <span className="text-slate-800 font-medium">
                                                    {note.fechaEstimadaEntrega ? formatDate(note.fechaEstimadaEntrega) : 'No programada'}
                                                </span>
                                            </div>
                                        </div>
                                        {note.fechaRealEntrega && (
                                            <div className="flex items-start gap-2.5">
                                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 mt-0.5" />
                                                <div>
                                                    <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider text-emerald-600">Entregado El</span>
                                                    <span className="text-emerald-700 font-bold">{formatDate(note.fechaRealEntrega)}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2.5">
                                            <User className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Responsable Logística</span>
                                                <span className="text-slate-800 font-medium">{note.responsable?.nombre || 'No asignado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Artículos del Documento</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Descripción del Producto/Servicio</TableHead>
                                                <TableHead className="text-right">Cant. Solicitada</TableHead>
                                                <TableHead className="text-right">Cant. Entregada</TableHead>
                                                <TableHead className="text-right">Pendiente</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Total Solicitado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {note.items.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                    <TableCell className="text-right">{item.cantidadPedida}</TableCell>
                                                    <TableCell className="text-right font-bold text-slate-800">{item.cantidad}</TableCell>
                                                    <TableCell className="text-right font-semibold text-amber-600">{item.cantidadPendiente}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatCurrency(item.cantidadPedida * item.precioUnitario)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Side: Totals, Notes & Timeline */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalles del Cargo Estimado</CardTitle>
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
                                    <CardTitle>Observaciones del Documento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {note.observaciones && (
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Notas para el Cliente (Visibles)</span>
                                            <p className="text-slate-700 text-sm whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{note.observaciones}"</p>
                                        </div>
                                    )}
                                    {note.notasInternas && (
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-amber-700 tracking-wider mb-1">Notas Internas (Confidencial)</span>
                                            <p className="text-amber-800 text-sm whitespace-pre-line bg-amber-50/50 p-3 rounded-lg border border-amber-100 font-medium">
                                                {note.notasInternas}
                                            </p>
                                        </div>
                                    )}
                                    {!note.observaciones && !note.notasInternas && (
                                        <p className="text-xs text-muted-foreground text-center py-2">Sin observaciones registradas.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial del Documento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative pl-6 border-l space-y-6">
                                        {note.historialEstados.map((hist, idx) => (
                                            <div key={hist.id} className="relative">
                                                <div className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-white ${
                                                    hist.estadoNuevo === 'facturado' ? 'border-emerald-600 bg-emerald-600' :
                                                    hist.estadoNuevo === 'entregado' ? 'border-green-500 bg-green-500' :
                                                    hist.estadoNuevo === 'anulado' ? 'border-red-500 bg-red-500' : 'border-brand-1 bg-brand-1'
                                                }`} />
                                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                                    {hist.estadoAnterior ? getEstadoLabel(hist.estadoAnterior) : 'Creación'}
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                    <span className={
                                                        hist.estadoNuevo === 'facturado' ? 'text-emerald-600' :
                                                        hist.estadoNuevo === 'entregado' ? 'text-green-600' :
                                                        hist.estadoNuevo === 'anulado' ? 'text-red-600' : 'text-brand-1'
                                                    }>{getEstadoLabel(hist.estadoNuevo)}</span>
                                                </p>
                                                {hist.notas && <p className="text-[11px] text-slate-600 mt-0.5">{hist.notas}</p>}
                                                <p className="text-[10px] text-muted-foreground mt-1 flex justify-between gap-2">
                                                    <span>Por: {hist.usuario.nombre}</span>
                                                    <span>{formatDate(hist.fechaCambio)}</span>
                                                </p>
                                            </div>
                                        ))}

                                        {note.estado === 'facturado' && note.factura && (
                                            <div className="relative pt-2 border-t border-slate-100">
                                                <div className="absolute -left-[31px] top-4 h-3.5 w-3.5 rounded-full border-2 border-emerald-600 bg-emerald-600" />
                                                <p className="text-xs font-bold text-emerald-600">Facturado</p>
                                                <Link 
                                                    href={`/invoices/${note.factura.id}`} 
                                                    className="text-xs font-semibold text-brand-1 hover:underline block mt-0.5"
                                                >
                                                    Ver Factura {note.factura.numeroCompleto || 'Emitida'}
                                                </Link>
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
