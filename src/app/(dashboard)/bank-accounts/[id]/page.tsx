import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { getTenantContext } from '@/lib/auth/context';
import { BankAccountDetailClient } from '@/components/bank-accounts/BankAccountDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BankAccountDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const { id } = await params;
    const { empresaId } = await getTenantContext();
    const sp = await searchParams;
    const page = Number(sp.page) || 1;
    const limit = Math.min(Number(sp.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const cuenta = await prisma.cuentaBancaria.findFirst({
        where: { id, empresaId },
        include: { cuentaContable: { select: { codigo: true, nombre: true } } },
    });

    if (!cuenta) {
        notFound();
    }

    // Los movimientos se paginan (evita traer toda la tabla si la cuenta tiene miles
    // de movimientos importados), pero los totales de la cabecera (saldo actual,
    // depositos/retiros, pendientes de conciliar) se calculan aparte sobre el universo
    // completo de la cuenta, no solo sobre la página visible.
    const whereMovimientos = { cuentaBancariaId: id, empresaId };

    const [movimientos, totalCount, depositosAgg, retirosAgg, pendientesConciliar] = await Promise.all([
        prisma.movimientoBancario.findMany({
            where: whereMovimientos,
            orderBy: { fecha: 'desc' },
            skip,
            take: limit,
        }),
        prisma.movimientoBancario.count({ where: whereMovimientos }),
        prisma.movimientoBancario.aggregate({
            where: { ...whereMovimientos, tipo: 'DEPOSITO' },
            _sum: { monto: true },
        }),
        prisma.movimientoBancario.aggregate({
            where: { ...whereMovimientos, tipo: 'RETIRO' },
            _sum: { monto: true },
        }),
        prisma.movimientoBancario.count({ where: { ...whereMovimientos, conciliado: false } }),
    ]);

    const totales = {
        totalDepositos: Number(depositosAgg._sum.monto || 0),
        totalRetiros: Number(retirosAgg._sum.monto || 0),
        pendientesConciliar,
    };

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
            <BankAccountDetailClient
                cuenta={cuentaFormatted}
                movimientos={movimientosFormatted}
                totales={totales}
                pagination={{ page, limit, totalCount }}
            />
        </>
    );
}
