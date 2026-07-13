import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { getTenantContext } from '@/lib/auth/context';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function formatCurrency(val: number) {
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(val);
}

export default async function CreditNotesListPage() {
    const { empresaId } = await getTenantContext();

    const creditNotes = await prisma.factura.findMany({
        where: {
            empresaId,
            tipoDocumento: '04'
        },
        include: {
            cliente: true,
            facturaOrigen: true,
            items: true
        },
        orderBy: {
            fechaEmision: 'desc'
        },
        take: 100
    });

    return (
        <>
            <Topbar title="Notas de Crédito Fiscales" />
            <ContentContainer>
                <div className="space-y-6 max-w-7xl mx-auto pb-12">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div>
                            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2.5">
                                <FileText className="h-7 w-7 text-danger" />
                                Notas de Crédito y Devoluciones (DGI)
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Historial de notas de crédito fiscales emitidas en Panamá para devoluciones, descuentos o anulaciones.
                            </p>
                        </div>
                        <Link href="/credit-notes/new">
                            <Button className="bg-danger hover:bg-danger/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Nueva Nota de Crédito
                            </Button>
                        </Link>
                    </div>

                    {/* Tabla de Notas de Crédito */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted text-xs text-muted-foreground font-bold uppercase">
                                <TableRow>
                                    <TableHead className="pl-6">Número DGI</TableHead>
                                    <TableHead>Fecha Emisión</TableHead>
                                    <TableHead>Cliente Afectado</TableHead>
                                    <TableHead>Documento Ref.</TableHead>
                                    <TableHead>Motivo / Observaciones</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right pr-6">Total Devolución</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border text-sm">
                                {creditNotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-10 w-10 text-muted-foreground" />
                                                <p className="font-bold text-muted-foreground">No hay notas de crédito emitidas</p>
                                                <p className="text-xs text-muted-foreground">Emite tu primera nota de crédito fiscal desde el botón superior.</p>
                                                <Link href="/credit-notes/new" className="mt-2">
                                                    <Button variant="outline" size="sm" className="rounded-xl">
                                                        + Crear Nota de Crédito
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    creditNotes.map((nc) => (
                                        <TableRow key={nc.id} className="hover:bg-accent/50 transition-colors">
                                            <TableCell className="pl-6 font-bold text-foreground">
                                                {nc.numeroCompleto}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {new Date(nc.fechaEmision).toLocaleDateString('es-PA')}
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground">
                                                {nc.cliente.razonSocial}
                                                <span className="block text-[11px] text-muted-foreground font-normal">RUC: {nc.cliente.ruc}</span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {nc.facturaOrigen ? (
                                                    <span className="font-semibold text-info">{nc.facturaOrigen.numeroCompleto}</span>
                                                ) : (
                                                    <span className="text-muted-foreground font-mono">Ref. Externa / CUFE</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={nc.motivoAnulacion || ''}>
                                                {nc.motivoAnulacion || 'Devolución fiscal'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={nc.estadoDgi} className="text-[10px]" />
                                            </TableCell>
                                            <TableCell className="text-right pr-6 font-extrabold text-danger">
                                                {formatCurrency(Number(nc.totalNeto))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </ContentContainer>
        </>
    );
}
