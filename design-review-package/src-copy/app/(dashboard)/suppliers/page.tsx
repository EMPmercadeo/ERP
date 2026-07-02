import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { SupplierList } from '@/components/suppliers/SupplierList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function SuppliersPage() {
    const { empresaId } = await getTenantContext();

    const suppliers = await prisma.proveedor.findMany({
        where: { empresaId },
        take: 1000,
        orderBy: { razonSocial: 'asc' },
        include: {
            compras: {
                where: { estadoPago: { not: 'anulada' } },
                select: {
                    id: true,
                    fechaEmision: true,
                    fechaVencimiento: true,
                    saldoPendiente: true,
                    totalNeto: true,
                }
            }
        }
    });

    const now = new Date();

    let totalPorPagar = 0;
    let saldoVencido = 0;
    let proximosVencimientos = 0;
    let proveedoresActivos = 0;

    const formattedSuppliers = suppliers.map(s => {
        if (s.estado === 'activo') proveedoresActivos++;

        let realSaldoPendiente = 0;
        let realSaldoVencido = 0;
        let ultimaCompra: string | null = null;

        if (s.compras && s.compras.length > 0) {
            // Sort to find latest purchase date
            const sortedCompras = [...s.compras].sort((a, b) => b.fechaEmision.getTime() - a.fechaEmision.getTime());
            ultimaCompra = sortedCompras[0].fechaEmision.toISOString();

            for (const c of s.compras) {
                const saldo = Number(c.saldoPendiente);
                if (saldo > 0) {
                    realSaldoPendiente += saldo;
                    if (c.fechaVencimiento < now) {
                        realSaldoVencido += saldo;
                    } else {
                        proximosVencimientos += saldo;
                    }
                }
            }
        }

        totalPorPagar += realSaldoPendiente;
        saldoVencido += realSaldoVencido;

        return {
            id: s.id,
            tipoRuc: s.tipoRuc,
            ruc: s.ruc,
            dv: s.dv,
            razonSocial: s.razonSocial,
            nombreComercial: s.nombreComercial,
            nombreContacto: s.nombreContacto || null,
            email: s.email,
            telefono: s.telefono,
            saldoPendiente: realSaldoPendiente,
            vencido: realSaldoVencido,
            ultimaCompra,
            condicionPago: s.condicionPago,
            limiteCredito: s.limiteCredito ? Number(s.limiteCredito) : null,
            observaciones: s.observaciones || null,
            estado: s.estado
        };
    });

    const summary = {
        totalPorPagar,
        saldoVencido,
        proximosVencimientos,
        proveedoresActivos
    };

    return (
        <>
            <Topbar title="Proveedores" />
            <SupplierList initialData={formattedSuppliers} summary={summary} />
        </>
    );
}
