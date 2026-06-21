'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    Edit,
    FileText,
    CheckCircle2,
    XCircle,
    AlertCircle,
    User,
    DollarSign,
    Scale
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface ClientDetailProps {
    client: {
        id: string;
        tipoRuc: string;
        ruc: string;
        dv: string;
        razonSocial: string;
        nombreComercial: string;
        direccion: string;
        email: string;
        telefono: string;
        limiteCredito: number;
        saldoPendiente: number;
        saldoAFavor: number;
        condicionPago: string;
        estado: string;
        createdAt: string;
    };
    invoices: Array<{
        id: string;
        numeroCompleto: string | null;
        fechaEmision: string;
        totalNeto: number;
        saldoPendiente: number;
        estadoDgi: string;
        tipoDocumento: string;
    }>;
    payments: Array<{
        id: string;
        fechaPago: string;
        monto: number;
        metodoPago: string;
        referencia: string;
    }>;
    initialTab: string;
}

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'neutral'> = {
    activo: 'success',
    moroso: 'warning',
    bloqueado: 'destructive',
};

const statusLabels: Record<string, string> = {
    activo: 'Activo',
    moroso: 'Moroso',
    bloqueado: 'Bloqueado',
};

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

export function ClientDetailClient({ client, invoices, payments, initialTab }: ClientDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'statement'>(
        (initialTab === 'invoices' || initialTab === 'statement') ? initialTab : 'info'
    );

    // Calculate metrics
    const totalFacturado = useMemo(() => {
        return invoices.reduce((sum, inv) => sum + inv.totalNeto, 0);
    }, [invoices]);

    const totalPagado = useMemo(() => {
        return payments.reduce((sum, p) => sum + p.monto, 0);
    }, [payments]);

    // Build Contable Ledger (Chronological transactions statement)
    const ledger = useMemo(() => {
        const items = [
            ...invoices.map(f => ({
                id: f.id,
                date: new Date(f.fechaEmision),
                description: `Factura ${f.numeroCompleto || 'Borrador'}`,
                type: 'charge' as const, // Debit/Cargo
                amount: f.totalNeto,
                refLink: `/invoices/${f.id}`
            })),
            ...payments.map(p => ({
                id: p.id,
                date: new Date(p.fechaPago),
                description: `Pago registrado (${p.metodoPago.toUpperCase()})${p.referencia ? ` - Ref: ${p.referencia}` : ''}`,
                type: 'credit' as const, // Credit/Abono
                amount: p.monto,
                refLink: null
            }))
        ];

        // Sort chronologically (oldest first)
        items.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate running balance
        let balance = 0;
        return items.map(item => {
            if (item.type === 'charge') {
                balance += item.amount;
            } else {
                balance -= item.amount;
            }
            return {
                ...item,
                runningBalance: balance
            };
        });
    }, [invoices, payments]);

    return (
        <>
            <Topbar title={`${client.razonSocial}`} />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Back link */}
                    <div className="flex items-center justify-between">
                        <Link href="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Volver a Clientes
                        </Link>
                        <Button asChild size="sm" variant="outline">
                            <Link href={`/clients/${client.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Cliente
                            </Link>
                        </Button>
                    </div>

                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-brand-1/10 text-brand-1 flex items-center justify-center font-bold text-xl">
                                {client.razonSocial.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold text-slate-900">{client.razonSocial}</h1>
                                    <Badge variant={statusVariants[client.estado] || 'neutral'}>
                                        {statusLabels[client.estado] || client.estado}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    RUC: {client.ruc}{client.dv ? ` - DV: ${client.dv}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Pendiente</CardTitle>
                                <Scale className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">
                                    {formatCurrency(client.saldoPendiente)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Deuda acumulada por facturas no cobradas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Facturado</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-700">
                                    {formatCurrency(totalFacturado)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Suma acumulada de todas las facturas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Límite de Crédito</CardTitle>
                                <CreditCard className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-700">
                                    {formatCurrency(client.limiteCredito)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Condición: {client.condicionPago}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Información General
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'invoices'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Facturas ({invoices.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('statement')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'statement'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Estado de Cuenta
                        </button>
                    </div>

                    {/* Tab Contents */}
                    {activeTab === 'info' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos del Cliente</CardTitle>
                                <CardDescription>Información fiscal y comercial registrada</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2.5">
                                        <User className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Razón Social</span>
                                            <span className="text-slate-800 font-medium">{client.razonSocial}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <User className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tipo RUC / Cédula</span>
                                            <span className="text-slate-800 font-medium">
                                                {client.tipoRuc === '01' ? 'Natural' : client.tipoRuc === '02' ? 'Jurídica' : client.tipoRuc === '03' ? 'Gobierno' : 'Extranjero'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Mail className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Correo Electrónico</span>
                                            <span className="text-slate-800 font-medium">{client.email || 'Sin correo registrado'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Phone className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Teléfono</span>
                                            <span className="text-slate-800 font-medium">{client.telefono || 'Sin teléfono registrado'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2.5">
                                        <MapPin className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Dirección</span>
                                            <span className="text-slate-800 font-medium">{client.direccion || 'Sin dirección registrada'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <CreditCard className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Condiciones de Pago</span>
                                            <span className="text-slate-800 font-medium">{client.condicionPago}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Calendar className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Fecha de Registro</span>
                                            <span className="text-slate-800 font-medium">{formatDate(client.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'invoices' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Facturas Emitidas</CardTitle>
                                <CardDescription>Listado completo de documentos generados</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Número de Factura</TableHead>
                                            <TableHead>Fecha Emisión</TableHead>
                                            <TableHead>Total Neto</TableHead>
                                            <TableHead>Saldo Pendiente</TableHead>
                                            <TableHead>Estado DGI</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.length > 0 ? invoices.map(inv => (
                                            <TableRow 
                                                key={inv.id} 
                                                className="cursor-pointer hover:bg-slate-50/80"
                                                onClick={() => router.push(`/invoices/${inv.id}`)}
                                            >
                                                <TableCell className="font-semibold text-slate-800">
                                                    {inv.numeroCompleto || 'Borrador'}
                                                </TableCell>
                                                <TableCell>{formatDate(inv.fechaEmision)}</TableCell>
                                                <TableCell>{formatCurrency(inv.totalNeto)}</TableCell>
                                                <TableCell>
                                                    {inv.saldoPendiente > 0 ? (
                                                        <Badge variant="warning">{formatCurrency(inv.saldoPendiente)}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">$0.00</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={
                                                            inv.estadoDgi === 'aceptada' 
                                                                ? 'success' 
                                                                : inv.estadoDgi === 'pendiente' 
                                                                    ? 'warning' 
                                                                    : inv.estadoDgi === 'rechazada' || inv.estadoDgi === 'error'
                                                                        ? 'destructive' 
                                                                        : 'neutral'
                                                        }
                                                    >
                                                        {inv.estadoDgi.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Este cliente no tiene facturas emitidas.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'statement' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Estado de Cuenta Contable</CardTitle>
                                <CardDescription>Movimientos cronológicos de cargos (facturas) y abonos (pagos)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Descripción / Documento</TableHead>
                                            <TableHead className="text-right">Cargos (+)</TableHead>
                                            <TableHead className="text-right">Abonos (-)</TableHead>
                                            <TableHead className="text-right">Balance Acumulado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ledger.length > 0 ? ledger.map((entry, index) => (
                                            <TableRow key={index} className="hover:bg-slate-50/50">
                                                <TableCell className="text-sm">{formatDate(entry.date.toISOString())}</TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    {entry.refLink ? (
                                                        <Link href={entry.refLink} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                            {entry.description}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-800">{entry.description}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600 text-sm font-medium">
                                                    {entry.type === 'charge' ? `+${formatCurrency(entry.amount)}` : ''}
                                                </TableCell>
                                                <TableCell className="text-right text-emerald-600 text-sm font-medium">
                                                    {entry.type === 'credit' ? `-${formatCurrency(entry.amount)}` : ''}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-800 text-sm">
                                                    {formatCurrency(entry.runningBalance)}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Sin movimientos contables registrados.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </ContentContainer>
        </>
    );
}
