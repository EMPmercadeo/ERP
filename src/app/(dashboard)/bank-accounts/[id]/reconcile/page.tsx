import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { getTenantContext } from '@/lib/auth/context';
import { ReconcileClient } from '@/components/bank-accounts/ReconcileClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ReconcilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { empresaId } = await getTenantContext();

    const cuenta = await prisma.cuentaBancaria.findFirst({
        where: { id, empresaId },
        include: { cuentaContable: { select: { codigo: true, nombre: true } } },
    });

    if (!cuenta) {
        notFound();
    }

    const movimientos = await prisma.movimientoBancario.findMany({
        where: { cuentaBancariaId: id, empresaId, conciliado: false },
        orderBy: { fecha: 'asc' },
    });

    const lineas = await prisma.asientoContableLinea.findMany({
        where: {
            cuentaId: cuenta.cuentaContableId,
            asiento: {
                empresaId,
                movimientosBancarios: { none: { conciliado: true } },
            },
        },
        include: { asiento: true },
        orderBy: { asiento: { fecha: 'asc' } },
    });

    const movimientosFormatted = movimientos.map((m) => ({
        id: m.id,
        fecha: m.fecha.toISOString(),
        descripcion: m.descripcion,
        monto: Number(m.monto),
        tipo: m.tipo,
        referencia: m.referencia,
        origenImportacion: m.origenImportacion,
    }));

    const lineasFormatted = lineas.map((l) => ({
        id: l.id,
        asientoContableId: l.asientoId,
        asientoNumero: l.asiento.numero,
        fecha: l.asiento.fecha.toISOString(),
        concepto: l.asiento.concepto,
        origen: l.asiento.origen,
        debe: Number(l.debe),
        haber: Number(l.haber),
        descripcion: l.descripcion,
    }));

    return (
        <>
            <Topbar title={`Conciliación — ${cuenta.nombre}`} />
            <ReconcileClient
                cuentaId={cuenta.id}
                cuentaNombre={cuenta.nombre}
                cuentaContableLabel={`${cuenta.cuentaContable.codigo} — ${cuenta.cuentaContable.nombre}`}
                movimientos={movimientosFormatted}
                lineas={lineasFormatted}
            />
        </>
    );
}
