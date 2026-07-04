import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { LedgerView } from '@/components/accounting/LedgerView';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function LedgerPage(props: {
    searchParams: Promise<{
        cuentaId?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { empresaId } = await getTenantContext();
    const selectedCuentaId = searchParams.cuentaId || 'none';

    // Obtener catálogo de cuentas para el dropdown
    const cuentas = await prisma.planCuentas.findMany({
        where: { empresaId },
        orderBy: { codigo: 'asc' }
    });

    const cuentasFormatted = cuentas.map(c => ({
        id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        naturaleza: c.naturaleza
    }));

    let movements: any[] = [];
    let totalDebe = 0;
    let totalHaber = 0;
    let saldoFinal = 0;
    let naturaleza = 'DEUDORA';

    if (selectedCuentaId && selectedCuentaId !== 'none') {
        const selectedCuenta = cuentas.find(c => c.id === selectedCuentaId);
        if (selectedCuenta) {
            naturaleza = selectedCuenta.naturaleza;

            const lines = await prisma.asientoContableLinea.findMany({
                where: {
                    cuentaId: selectedCuentaId,
                    asiento: { empresaId }
                },
                include: {
                    asiento: true
                },
                orderBy: [
                    { asiento: { fecha: 'asc' } },
                    { asiento: { numero: 'asc' } }
                ]
            });

            totalDebe = lines.reduce((s, l) => s + l.debe.toNumber(), 0);
            totalHaber = lines.reduce((s, l) => s + l.haber.toNumber(), 0);

            let balance = 0;
            movements = lines.map(l => {
                const debeNum = l.debe.toNumber();
                const haberNum = l.haber.toNumber();
                if (naturaleza === 'DEUDORA') {
                    balance += debeNum - haberNum;
                } else {
                    balance += haberNum - debeNum;
                }
                return {
                    id: l.id,
                    fecha: l.asiento.fecha.toISOString(),
                    asientoNumero: l.asiento.numero,
                    concepto: l.asiento.concepto,
                    origen: l.asiento.origen,
                    debe: debeNum,
                    haber: haberNum,
                    descripcion: l.descripcion,
                    runningBalance: balance
                };
            });

            saldoFinal = balance;
        }
    }

    return (
        <>
            <Topbar title="Libro Mayor" />
            <LedgerView 
                cuentas={cuentasFormatted}
                selectedCuentaId={selectedCuentaId}
                movements={movements}
                totalDebe={totalDebe}
                totalHaber={totalHaber}
                saldoFinal={saldoFinal}
                naturaleza={naturaleza}
            />
        </>
    );
}
