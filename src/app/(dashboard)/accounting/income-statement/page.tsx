import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { IncomeStatementView } from '@/components/accounting/IncomeStatementView';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function IncomeStatementPage(props: {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { empresaId } = await getTenantContext();

    const currentYear = new Date().getFullYear();
    const defaultStart = `${currentYear}-01-01`;
    const defaultEnd = `${currentYear}-12-31`;
    const startDateStr = searchParams.startDate || defaultStart;
    const endDateStr = searchParams.endDate || defaultEnd;

    const start = new Date(`${startDateStr}T00:00:00Z`);
    const end = new Date(`${endDateStr}T23:59:59Z`);

    // Obtener catálogo de cuentas operacionales
    const cuentas = await prisma.planCuentas.findMany({
        where: {
            empresaId,
            tipo: { in: ['INGRESO', 'COSTO', 'GASTO'] }
        },
        orderBy: { codigo: 'asc' }
    });

    // Agrupar movimientos de base de datos en el rango de fechas
    const aggregates = await prisma.asientoContableLinea.groupBy({
        by: ['cuentaId'],
        where: {
            asiento: {
                empresaId,
                fecha: { gte: start, lte: end }
            },
            cuentaId: { in: cuentas.map(c => c.id) }
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

    // Calcular saldos acumulados para todas las cuentas
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
        if (c.tipo === 'INGRESO') {
            balance = haberAcumulado - debeAcumulado;
        } else {
            balance = debeAcumulado - haberAcumulado;
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

    // Filtrar solo cuentas auxiliares (leaf accounts) con balance no cero para evitar duplicación
    const leafItems = items.filter(i => i.aceptaMovimiento && Math.abs(i.balance) >= 0.005);

    const ingresos = leafItems.filter(i => i.tipo === 'INGRESO');
    const costos = leafItems.filter(i => i.tipo === 'COSTO');
    const gastos = leafItems.filter(i => i.tipo === 'GASTO');

    const totalIngresos = ingresos.reduce((sum, item) => sum + item.balance, 0);
    const totalCostos = costos.reduce((sum, item) => sum + item.balance, 0);
    const totalGastos = gastos.reduce((sum, item) => sum + item.balance, 0);

    const utilidadBruta = totalIngresos - totalCostos;
    const utilidadNeta = utilidadBruta - totalGastos;

    return (
        <>
            <Topbar title="Estado de Resultados" />
            <IncomeStatementView 
                ingresos={ingresos}
                costos={costos}
                gastos={gastos}
                totalIngresos={totalIngresos}
                totalCostos={totalCostos}
                totalGastos={totalGastos}
                utilidadBruta={utilidadBruta}
                utilidadNeta={utilidadNeta}
                initialFilters={{
                    startDate: startDateStr,
                    endDate: endDateStr
                }}
            />
        </>
    );
}
