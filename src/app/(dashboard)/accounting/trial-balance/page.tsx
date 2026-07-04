import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { TrialBalanceView } from '@/components/accounting/TrialBalanceView';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function TrialBalancePage(props: {
    searchParams: Promise<{
        cutOffDate?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { empresaId } = await getTenantContext();
    const cutOffDateStr = searchParams.cutOffDate || new Date().toISOString().split('T')[0];
    const cutOffDate = new Date(`${cutOffDateStr}T23:59:59Z`);

    // Obtener catálogo completo de cuentas
    const cuentas = await prisma.planCuentas.findMany({
        where: { empresaId },
        orderBy: { codigo: 'asc' }
    });

    // Agrupar movimientos de base de datos hasta la fecha de corte
    const aggregates = await prisma.asientoContableLinea.groupBy({
        by: ['cuentaId'],
        where: {
            asiento: {
                empresaId,
                fecha: { lte: cutOffDate }
            }
        },
        _sum: {
            debe: true,
            haber: true
        }
    });

    const movementMap = new Map(
        aggregates.map(a => [
            a.cuentaId,
            {
                debe: a._sum.debe?.toNumber() || 0,
                haber: a._sum.haber?.toNumber() || 0
            }
        ])
    );

    // Calcular saldos acumulados (acumulando hijos en padres)
    const items = cuentas.map(c => {
        let debeAcumulado = 0;
        let haberAcumulado = 0;

        // Sumar todas las subcuentas que dependen de esta cuenta
        const childCuentas = cuentas.filter(child => child.codigo === c.codigo || child.codigo.startsWith(c.codigo + '.'));
        for (const child of childCuentas) {
            const movs = movementMap.get(child.id);
            if (movs) {
                debeAcumulado += movs.debe;
                haberAcumulado += movs.haber;
            }
        }

        let deudor = 0;
        let acreedor = 0;

        if (c.naturaleza === 'DEUDORA') {
            deudor = debeAcumulado - haberAcumulado;
        } else {
            acreedor = haberAcumulado - debeAcumulado;
        }

        return {
            id: c.id,
            codigo: c.codigo,
            nombre: c.nombre,
            tipo: c.tipo,
            naturaleza: c.naturaleza,
            aceptaMovimiento: c.aceptaMovimiento,
            debeAcumulado,
            haberAcumulado,
            deudor,
            acreedor
        };
    });

    // Calcular los totales del Balance usando SOLO cuentas auxiliares (leaf accounts) para evitar doble contabilización
    const leafItems = items.filter(item => item.aceptaMovimiento);
    const totalDeudor = leafItems.reduce((sum, item) => sum + item.deudor, 0);
    const totalAcreedor = leafItems.reduce((sum, item) => sum + item.acreedor, 0);

    return (
        <>
            <Topbar title="Balance de Comprobación" />
            <TrialBalanceView 
                initialData={items}
                totalDeudor={totalDeudor}
                totalAcreedor={totalAcreedor}
                initialFilters={{
                    cutOffDate: cutOffDateStr
                }}
            />
        </>
    );
}
