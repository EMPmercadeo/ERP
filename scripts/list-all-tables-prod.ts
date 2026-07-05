import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local', override: true });

import { PrismaClient } from '@prisma/client';

async function main() {
    const dbUrl = process.env.DATABASE_URL || '';
    const host = new URL(dbUrl).host;
    if (!host.includes('supabase') && !host.includes('pooler')) {
        throw new Error(`Host inesperado, no parece producción: ${host}`);
    }
    console.log(`Conectado a host: ${host}`);

    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
        const rows = await prisma.$queryRawUnsafe<{ tablename: string; rowsecurity: boolean }[]>(
            `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
        );
        for (const r of rows) {
            console.log(`${r.rowsecurity ? '✅' : '❌'} ${r.tablename}`);
        }
        console.log(`\nTotal: ${rows.length}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
