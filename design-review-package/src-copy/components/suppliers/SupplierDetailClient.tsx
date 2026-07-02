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
    FileText,
    DollarSign,
    Scale,
    Building2
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NewPaymentModal } from '@/components/purchases/NewPaymentModal';

interface SupplierDetailProps {
    supplier: {
        id: string;
        tipoRuc: string;
        ruc: string;
        dv: string;
        razonSocial: string;
        nombreComercial: string;
        nombreContacto?: string;
        direccion: string;
        email: string;
        telefono: string;
        saldoPendiente: number;
        limiteCredito?: number | null;
        observaciones?: string;
        condicionPago: string;
        estado: string;
        createdAt: string;
    };
    purchases: Array<{
        id: string;
        numeroFactura: string;
        fechaEmision: string;
        fechaVencimiento: string;
        totalNeto: number;
        saldoPendiente: number;
        estadoPago: string;
    }>;
    payments: Array<{
        id: string;
        compraId: string;
        fechaPago: string;
        monto: number;
        metodoPago: string;
        referencia: string;
    }>;
    initialTab: string;
}

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'neutral'> = {
    activo: 'success',
    inactivo: 'destructive',
};

const statusLabels: Record<string, string> = {
    activo: 'Activo',
    inactivo: 'Inactivo',
};

const purchaseStatusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'neutral'> = {
    pagada: 'success',
    parcial: 'warning',
    pendiente: 'destructive',
    vencida: 'destructive',
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

export function SupplierDetailClient({ supplier, purchases, payments, initialTab }: SupplierDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'info' | 'purchases' | 'payments' | 'statement'>(
        (initialTab === 'purchases' || initialTab === 'payments' || initialTab === 'statement') ? initialTab : 'info'
    );

    // Calculate metrics dynamically
    const validPurchases = useMemo(() => purchases.filter(p => p.estadoPago !== 'anulada'), [purchases]);

    const totalComprado = useMemo(() => {
        return validPurchases.reduce((sum, p) => sum + p.totalNeto, 0);
    }, [validPurchases]);

    const calculatedSaldoPendiente = useMemo(() => {
        return validPurchases.reduce((sum, p) => sum + p.saldoPendiente, 0);
    }, [validPurchases]);

    // Build Contable Ledger (Chronological transactions statement)
    const ledger = useMemo(() => {
        const items = [
            ...purchases.map(p => ({
                id: p.id,
                date: new Date(p.fechaEmision),
                description: `Compra Factura #${p.numeroFactura}${p.estadoPago === 'anulada' ? ' [ANULADA]' : ''}`,
                type: 'charge' as const,
                amount: p.estadoPago === 'anulada' ? 0 : p.totalNeto,
            })),
            ...payments.map(pay => {
                const purchase = purchases.find(pur => pur.id === pay.compraId);
                return {
                    id: pay.id,
                    date: new Date(pay.fechaPago),
                    description: `Pago a Factura #${purchase?.numeroFactura || 'Desc.'} (${pay.metodoPago.toUpperCase()})${pay.referencia ? ` - Ref: ${pay.referencia}` : ''}`,
                    type: 'credit' as const, // Abono (deuda disminuye)
                    amount: pay.monto,
                };
            })
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
    }, [purchases, payments]);

    return (
        <>
            <Topbar title={`${supplier.razonSocial}`} />
            <ContentContainer>
                <div className="space-y-6">
                    {/* Back link */}
                    <div className="flex items-center justify-between">
                        <Link href="/suppliers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Volver a Proveedores
                        </Link>
                    </div>

                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-brand-1/10 text-brand-1 flex items-center justify-center font-bold text-xl">
                                {supplier.razonSocial.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold text-slate-900">{supplier.razonSocial}</h1>
                                    <Badge variant={statusVariants[supplier.estado] || 'neutral'}>
                                        {statusLabels[supplier.estado] || supplier.estado}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    RUC: {supplier.ruc}{supplier.dv ? ` - DV: ${supplier.dv}` : ''}
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
                                    {formatCurrency(calculatedSaldoPendiente)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Cuentas por pagar pendientes de cobro</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Comprado</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-700">
                                    {formatCurrency(totalComprado)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Suma acumulada de todas las compras</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Términos de Pago</CardTitle>
                                <CreditCard className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-700">
                                    {supplier.condicionPago}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Término de pago comercial</p>
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
                            onClick={() => setActiveTab('purchases')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'purchases'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Facturas de Compra ({purchases.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payments'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Pagos Realizados ({payments.length})
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
                                <CardTitle>Datos del Proveedor</CardTitle>
                                <CardDescription>Información fiscal y comercial registrada</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2.5">
                                        <Building2 className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Razón Social</span>
                                            <span className="text-slate-800 font-medium">{supplier.razonSocial}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Building2 className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Nombre Comercial</span>
                                            <span className="text-slate-800 font-medium">{supplier.nombreComercial || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Building2 className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tipo RUC</span>
                                            <span className="text-slate-800 font-medium">
                                                {supplier.tipoRuc === '01' ? 'Natural' : supplier.tipoRuc === '02' ? 'Jurídica' : supplier.tipoRuc === '03' ? 'Gobierno' : 'Extranjero'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Building2 className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Contacto Principal</span>
                                            <span className="text-slate-800 font-medium">{supplier.nombreContacto || 'No especificado'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Mail className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Correo Electrónico</span>
                                            <span className="text-slate-800 font-medium">{supplier.email || 'Sin correo registrado'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2.5">
                                        <Phone className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Teléfono</span>
                                            <span className="text-slate-800 font-medium">{supplier.telefono || 'Sin teléfono registrado'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <MapPin className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Dirección</span>
                                            <span className="text-slate-800 font-medium">{supplier.direccion || 'Sin dirección registrada'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <CreditCard className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Términos de Pago</span>
                                            <span className="text-slate-800 font-medium">{supplier.condicionPago}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <DollarSign className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Límite de Crédito</span>
                                            <span className="text-slate-800 font-medium">{supplier.limiteCredito ? formatCurrency(supplier.limiteCredito) : 'Sin límite definido'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <FileText className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Observaciones</span>
                                            <span className="text-slate-800 font-medium">{supplier.observaciones || 'Sin notas adicionales'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <Calendar className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">Fecha de Registro</span>
                                            <span className="text-slate-800 font-medium">{formatDate(supplier.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'purchases' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Facturas de Compra</CardTitle>
                                <CardDescription>Listado completo de cuentas por pagar</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Factura No.</TableHead>
                                            <TableHead>Fecha Emisión</TableHead>
                                            <TableHead>Vencimiento</TableHead>
                                            <TableHead>Total Neto</TableHead>
                                            <TableHead>Saldo Pendiente</TableHead>
                                            <TableHead>Estado Pago</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchases.length > 0 ? purchases.map(pur => (
                                            <TableRow key={pur.id}>
                                                <TableCell className="font-semibold text-slate-800">
                                                    #{pur.numeroFactura}
                                                </TableCell>
                                                <TableCell>{formatDate(pur.fechaEmision)}</TableCell>
                                                <TableCell>{formatDate(pur.fechaVencimiento)}</TableCell>
                                                <TableCell>{formatCurrency(pur.totalNeto)}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {pur.saldoPendiente > 0 ? (
                                                        <span className="text-amber-600">{formatCurrency(pur.saldoPendiente)}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">$0.00</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={purchaseStatusVariants[pur.estadoPago] || 'neutral'}>
                                                        {pur.estadoPago.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {pur.saldoPendiente > 0 && (
                                                        <NewPaymentModal 
                                                            compraId={pur.id}
                                                            proveedorId={supplier.id}
                                                            numeroFactura={pur.numeroFactura}
                                                            proveedorNombre={supplier.razonSocial}
                                                            saldoPendiente={pur.saldoPendiente}
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                                    Este proveedor no tiene facturas de compra registradas.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'payments' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Pagos</CardTitle>
                                <CardDescription>Pagos aplicados a facturas de compra</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Factura Relacionada</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead>Referencia</TableHead>
                                            <TableHead className="text-right">Monto Pagado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.length > 0 ? payments.map(pay => {
                                            const purchase = purchases.find(p => p.id === pay.compraId);
                                            return (
                                                <TableRow key={pay.id}>
                                                    <TableCell>{formatDate(pay.fechaPago)}</TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        #{purchase?.numeroFactura || 'Desconocida'}
                                                    </TableCell>
                                                    <TableCell>{pay.metodoPago}</TableCell>
                                                    <TableCell>{pay.referencia || '-'}</TableCell>
                                                    <TableCell className="text-right font-semibold text-emerald-600">
                                                        {formatCurrency(pay.monto)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    No se han registrado pagos para este proveedor.
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
                                <CardTitle>Estado de Cuenta</CardTitle>
                                <CardDescription>Movimientos contables cronológicos de cargos y abonos</CardDescription>
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
                                                <TableCell className="text-sm font-medium text-slate-800">
                                                    {entry.description}
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
