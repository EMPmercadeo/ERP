import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { JournalList } from '@/components/accounting/JournalList';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export default async function JournalPage(props: {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
        origen?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { empresaId } = await getTenantContext();
    const startDate = searchParams.startDate;
    const endDate = searchParams.endDate;
    const origen = searchParams.origen;

    const andConditions: Prisma.AsientoContableWhereInput[] = [];

    if (startDate) {
        andConditions.push({ fecha: { gte: new Date(`${startDate}T00:00:00Z`) } });
    }
    if (endDate) {
        andConditions.push({ fecha: { lte: new Date(`${endDate}T23:59:59Z`) } });
    }
    if (origen && origen !== 'all') {
        andConditions.push({ origen });
    }

    const where: Prisma.AsientoContableWhereInput = {
        empresaId,
        AND: andConditions.length > 0 ? andConditions : undefined
    };

    const [asientos, aggregateTotals] = await Promise.all([
        prisma.asientoContable.findMany({
            where,
            orderBy: { numero: 'asc' },
            include: {
                usuario: { select: { nombre: true } },
                lineas: {
                    include: {
                        cuenta: { select: { codigo: true, nombre: true, tipo: true } }
                    },
                    orderBy: [
                        { debe: 'desc' },
                        { haber: 'desc' }
                    ]
                }
            }
        }),
        prisma.asientoContable.aggregate({
            _sum: {
                totalDebe: true,
                totalHaber: true,
            },
            where
        })
    ]);

    const formattedAsientos = asientos.map(a => ({
        id: a.id,
        numero: a.numero,
        fecha: a.fecha.toISOString(),
        concepto: a.concepto,
        origen: a.origen,
        origenId: a.origenId,
        totalDebe: a.totalDebe.toNumber(),
        totalHaber: a.totalHaber.toNumber(),
        estado: a.estado,
        usuario: {
            nombre: a.usuario.nombre
        },
        lineas: a.lineas.map(l => ({
            id: l.id,
            cuenta: {
                codigo: l.cuenta.codigo,
                nombre: l.cuenta.nombre,
                tipo: l.cuenta.tipo
            },
            debe: l.debe.toNumber(),
            haber: l.haber.toNumber(),
            descripcion: l.descripcion
        }))
    }));

    const totalDebeGlobal = aggregateTotals._sum.totalDebe?.toNumber() || 0;
    const totalHaberGlobal = aggregateTotals._sum.totalHaber?.toNumber() || 0;

    return (
        <>
            <Topbar title="Libro Diario" />
            <JournalList 
                initialData={formattedAsientos}
                totalDebeGlobal={totalDebeGlobal}
                totalHaberGlobal={totalHaberGlobal}
                initialFilters={{
                    startDate,
                    endDate,
                    origen
                }}
            />
        </>
    );
}
