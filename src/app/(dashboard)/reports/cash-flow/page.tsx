import { addDays } from 'date-fns';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { getTenantContext } from '@/lib/auth/context';
import { CashFlowView, type CashFlowBucket } from '@/components/reports/CashFlowView';

export const dynamic = 'force-dynamic';

const BUCKET_ORDER = ['Vencido', '0-30 días', '31-60 días', '61-90 días', 'Más de 90 días'] as const;

function getBucketLabel(dias: number): typeof BUCKET_ORDER[number] {
    if (dias < 0) return 'Vencido';
    if (dias <= 30) return '0-30 días';
    if (dias <= 60) return '31-60 días';
    if (dias <= 90) return '61-90 días';
    return 'Más de 90 días';
}

export default async function CashFlowPage() {
    const { empresaId } = await getTenantContext();
    const hoy = new Date();

    // CxC: facturas con saldo pendiente. Usa fechaVencimiento cuando existe;
    // si es null (campo opcional en el modelo), estima fechaEmision + 30 días.
    const facturas = await prisma.factura.findMany({
        where: {
            empresaId,
            saldoPendiente: { gt: 0 },
            estadoDgi: { not: 'anulada' },
        },
        select: { id: true, fechaEmision: true, fechaVencimiento: true, saldoPendiente: true },
    });

    let facturasSinFechaEstimadas = 0;

    // CxP: compras con saldo pendiente. fechaVencimiento es obligatorio en el modelo.
    const compras = await prisma.compra.findMany({
        where: {
            empresaId,
            saldoPendiente: { gt: 0 },
            estadoPago: { notIn: ['pagada', 'anulada'] },
        },
        select: { id: true, fechaVencimiento: true, saldoPendiente: true },
    });

    const buckets = new Map<string, { ingresos: number; egresos: number }>(
        BUCKET_ORDER.map((b) => [b, { ingresos: 0, egresos: 0 }])
    );

    for (const f of facturas) {
        const vencimiento = f.fechaVencimiento ?? addDays(f.fechaEmision, 30);
        if (!f.fechaVencimiento) facturasSinFechaEstimadas++;
        const dias = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        const bucket = buckets.get(getBucketLabel(dias))!;
        bucket.ingresos += Number(f.saldoPendiente);
    }

    for (const c of compras) {
        const dias = Math.floor((c.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        const bucket = buckets.get(getBucketLabel(dias))!;
        bucket.egresos += Number(c.saldoPendiente);
    }

    const data: CashFlowBucket[] = BUCKET_ORDER.map((label) => {
        const b = buckets.get(label)!;
        return {
            label,
            ingresos: b.ingresos,
            egresos: b.egresos,
            neto: b.ingresos - b.egresos,
        };
    });

    const totales: CashFlowBucket = {
        label: 'Total',
        ingresos: data.reduce((s, d) => s + d.ingresos, 0),
        egresos: data.reduce((s, d) => s + d.egresos, 0),
        neto: data.reduce((s, d) => s + d.neto, 0),
    };

    return (
        <>
            <Topbar title="Flujo de Caja Proyectado" />
            <CashFlowView
                data={data}
                totales={totales}
                facturasSinFechaEstimadas={facturasSinFechaEstimadas}
            />
        </>
    );
}
