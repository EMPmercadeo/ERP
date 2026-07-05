import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getTenantContext } from '@/lib/auth/context';
import { Calendar, Package, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ExpiringProductsPage() {
    const { empresaId } = await getTenantContext();

    const lotes = await prisma.loteProducto.findMany({
        where: {
            empresaId,
            cantidadDisponible: { gt: 0 },
            fechaVencimiento: { not: null }
        },
        include: {
            producto: true,
            bodega: true
        },
        orderBy: {
            fechaVencimiento: 'asc'
        }
    });

    const now = new Date();

    const formattedLotes = lotes.map(l => {
        const daysToExpiry = l.fechaVencimiento
            ? Math.ceil((l.fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;

        let status: 'expired' | 'critical' | 'normal' = 'normal';
        if (daysToExpiry !== null) {
            if (daysToExpiry <= 0) {
                status = 'expired';
            } else if (daysToExpiry <= 30) {
                status = 'critical';
            }
        }

        return {
            id: l.id,
            productoCodigo: l.producto.codigoInterno,
            productoDescripcion: l.producto.descripcion,
            bodegaNombre: l.bodega.nombre,
            numeroLote: l.numeroLote,
            fechaVencimiento: l.fechaVencimiento ? l.fechaVencimiento.toLocaleDateString('es-PA') : 'N/A',
            cantidadDisponible: l.cantidadDisponible,
            daysToExpiry,
            status
        };
    });

    return (
        <>
            <Topbar title="Alertas de Vencimiento" />
            <ContentContainer>
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Control de Lotes por Vencer</h1>
                        <p className="text-sm text-slate-500">
                            Visualiza los lotes de productos almacenados ordenados por su fecha de caducidad más cercana.
                        </p>
                    </div>

                    <Card className="border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Bodega</TableHead>
                                        <TableHead>No. Lote</TableHead>
                                        <TableHead>Fecha Vencimiento</TableHead>
                                        <TableHead>Días Restantes</TableHead>
                                        <TableHead className="text-right">Cantidad Disp.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formattedLotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Calendar className="h-8 w-8 text-slate-300" />
                                                    <p className="text-sm font-medium">No hay lotes con fecha de vencimiento</p>
                                                    <p className="text-xs">
                                                        Todos tus productos con control de lotes tienen stock al día o no tienen vencimiento próximo.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        formattedLotes.map((l) => (
                                            <TableRow key={l.id} className="hover:bg-slate-50/30">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">{l.productoDescripcion}</span>
                                                        <span className="text-xs text-slate-500 font-mono">{l.productoCodigo}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                                        {l.bodegaNombre}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-700">
                                                    {l.numeroLote}
                                                </TableCell>
                                                <TableCell className="text-slate-700">
                                                    {l.fechaVencimiento}
                                                </TableCell>
                                                <TableCell>
                                                    {l.status === 'expired' ? (
                                                        <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200">
                                                            Vencido ({Math.abs(l.daysToExpiry || 0)} días)
                                                        </Badge>
                                                    ) : l.status === 'critical' ? (
                                                        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200 animate-pulse">
                                                            Crítico ({l.daysToExpiry} días)
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200">
                                                            {l.daysToExpiry} días
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-slate-900">
                                                    {l.cantidadDisponible}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </ContentContainer>
        </>
    );
}
