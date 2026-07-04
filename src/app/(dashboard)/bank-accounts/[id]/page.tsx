import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { getTenantContext } from '@/lib/auth/context';
import { BankAccountDetailClient } from '@/components/bank-accounts/BankAccountDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BankAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        where: { cuentaBancariaId: id, empresaId },
        orderBy: { fecha: 'desc' },
    });

    const cuentaFormatted = {
        id: cuenta.id,
        nombre: cuenta.nombre,
        banco: cuenta.banco,
        numeroCuenta: cuenta.numeroCuenta,
        tipoCuenta: cuenta.tipoCuenta,
        cuentaContableId: cuenta.cuentaContableId,
        cuentaContableCodigo: cuenta.cuentaContable.codigo,
        cuentaContableNombre: cuenta.cuentaContable.nombre,
        saldoInicial: Number(cuenta.saldoInicial),
        activa: cuenta.activa,
    };

    const movimientosFormatted = movimientos.map((m) => ({
        id: m.id,
        fecha: m.fecha.toISOString(),
        descripcion: m.descripcion,
        monto: Number(m.monto),
        tipo: m.tipo,
        referencia: m.referencia,
        conciliado: m.conciliado,
        asientoContableId: m.asientoContableId,
        origenImportacion: m.origenImportacion,
    }));

    return (
        <>
            <Topbar title={`Cuenta Bancaria — ${cuenta.nombre}`} />
            <BankAccountDetailClient cuenta={cuentaFormatted} movimientos={movimientosFormatted} />
        </>
    );
}
