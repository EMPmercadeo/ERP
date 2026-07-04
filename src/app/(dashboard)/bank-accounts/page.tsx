import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { BankAccountList } from '@/components/bank-accounts/BankAccountList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BankAccountsPage() {
    const { empresaId } = await getTenantContext();

    const cuentas = await prisma.cuentaBancaria.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'asc' },
        include: {
            cuentaContable: { select: { codigo: true, nombre: true } },
            _count: { select: { movimientos: true } },
        },
    });

    const cuentasContables = await prisma.planCuentas.findMany({
        where: { empresaId, codigo: { startsWith: '1.1.01' }, aceptaMovimiento: true },
        orderBy: { codigo: 'asc' },
        select: { id: true, codigo: true, nombre: true },
    });

    const formattedCuentas = cuentas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        banco: c.banco,
        numeroCuenta: c.numeroCuenta,
        tipoCuenta: c.tipoCuenta,
        cuentaContableId: c.cuentaContableId,
        cuentaContableCodigo: c.cuentaContable.codigo,
        cuentaContableNombre: c.cuentaContable.nombre,
        saldoInicial: Number(c.saldoInicial),
        activa: c.activa,
        totalMovimientos: c._count.movimientos,
    }));

    return (
        <>
            <Topbar title="Cuentas Bancarias" />
            <BankAccountList initialData={formattedCuentas} cuentasContables={cuentasContables} />
        </>
    );
}
