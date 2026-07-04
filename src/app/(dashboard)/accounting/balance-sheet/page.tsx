import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { BalanceSheetView } from '@/components/accounting/BalanceSheetView';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function BalanceSheetPage(props: {
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

    // Calcular saldos acumulados
    const items = cuentas.map(c => {
        let debeAcumulado = 0;
        let haberAcumulado = 0;

        const childCuentas = cuentas.filter(child => child.codigo === c.codigo || child.codigo.startsWith(c.codigo + '.'));
        for (const child of childCuentas) {
            const movs = movementMap.get(child.id);
            if (movs) {
                debeAcumulado += movs.debe;
                haberAcumulado += movs.haber;
            }
        }

        let balance = 0;
        if (c.tipo === 'ACTIVO' || c.tipo === 'COSTO' || c.tipo === 'GASTO') {
            balance = debeAcumulado - haberAcumulado;
        } else {
            balance = haberAcumulado - debeAcumulado;
        }

        return {
            id: c.id,
            codigo: c.codigo,
            nombre: c.nombre,
            tipo: c.tipo,
            aceptaMovimiento: c.aceptaMovimiento,
            balance
        };
    });

    // Filtrar cuentas auxiliares (leaf accounts) con balance no cero
    const leafItems = items.filter(i => i.aceptaMovimiento && Math.abs(i.balance) >= 0.005);

    const activos = leafItems.filter(i => i.tipo === 'ACTIVO');
    const pasivos = leafItems.filter(i => i.tipo === 'PASIVO');
    const patrimonios = leafItems.filter(i => i.tipo === 'PATRIMONIO');

    const ingresos = leafItems.filter(i => i.tipo === 'INGRESO');
    const costos = leafItems.filter(i => i.tipo === 'COSTO');
    const gastos = leafItems.filter(i => i.tipo === 'GASTO');

    const totalActivos = activos.reduce((sum, item) => sum + item.balance, 0);
    const totalPasivos = pasivos.reduce((sum, item) => sum + item.balance, 0);
    const totalPatrimonioSinUtilidad = patrimonios.reduce((sum, item) => sum + item.balance, 0);

    const totalIngresos = ingresos.reduce((sum, item) => sum + item.balance, 0);
    const totalCostos = costos.reduce((sum, item) => sum + item.balance, 0);
    const totalGastos = gastos.reduce((sum, item) => sum + item.balance, 0);

    const utilidadEjercicio = totalIngresos - totalCostos - totalGastos;

    return (
        <>
            <Topbar title="Balance General" />
            <BalanceSheetView 
                activos={activos}
                pasivos={pasivos}
                patrimonios={patrimonios}
                utilidadEjercicio={utilidadEjercicio}
                totalActivos={totalActivos}
                totalPasivos={totalPasivos}
                totalPatrimonioSinUtilidad={totalPatrimonioSinUtilidad}
                initialFilters={{
                    cutOffDate: cutOffDateStr
                }}
            />
        </>
    );
}
