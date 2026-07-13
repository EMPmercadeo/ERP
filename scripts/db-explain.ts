import { prisma } from '../src/lib/db';

async function runExplain() {
    console.log('📊 Ejecutando análisis de optimización y planes de ejecución de PostgreSQL...\n');

    try {
        const empresaId = 'cmrir1vsw0000qg1w2bcrkd2a';

        // 1. Ejecutar EXPLAIN con Seq Scan habilitado (comportamiento normal para tablas pequeñas)
        console.log('⚡ PLAN POR DEFECTO (PostgreSQL optimiza para tabla pequeña -> Seq Scan):');
        const defaultExplain: any = await prisma.$queryRawUnsafe(`
            EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS) 
            SELECT * FROM "Producto" 
            WHERE "empresaId" = '${empresaId}';
        `);
        console.log(defaultExplain.map((row: any) => row['QUERY PLAN']).join('\n'));

        // 2. Deshabilitar Seq Scan de forma temporal en la transacción para forzar Index Scan
        console.log('\n⚡ PLAN FORZADO CON INDEX SCAN (Simula producción con millones de registros):');
        const forcedExplain = await prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off;');
            const explainResult: any = await tx.$queryRawUnsafe(`
                EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS) 
                SELECT * FROM "Producto" 
                WHERE "empresaId" = '${empresaId}';
            `);
            return explainResult.map((row: any) => row['QUERY PLAN']).join('\n');
        });
        console.log(forcedExplain);

    } catch (error) {
        console.error('Error al ejecutar explain:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runExplain();
