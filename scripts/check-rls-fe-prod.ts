import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local', override: true });

import { PrismaClient } from '@prisma/client';

const TABLES = ['ConfiguracionFacturacionElectronica', 'FacturaPACLog'];

async function main() {
    const dbUrl = process.env.DATABASE_URL || '';
    const host = new URL(dbUrl).host;
    if (!host.includes('supabase') && !host.includes('pooler')) {
        throw new Error(`Host inesperado, no parece producción: ${host}`);
    }
    console.log(`Conectado a host: ${host}`);

    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
        const rlsRows = await prisma.$queryRawUnsafe<{ tablename: string; rowsecurity: boolean }[]>(
            `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1)`,
            TABLES
        );
        const policyRows = await prisma.$queryRawUnsafe<{ tablename: string; policyname: string }[]>(
            `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = ANY($1)`,
            TABLES
        );
        for (const t of TABLES) {
            const rls = rlsRows.find((r) => r.tablename === t);
            const policies = policyRows.filter((p) => p.tablename === t).map((p) => p.policyname);
            console.log(`${t}: rowsecurity=${rls?.rowsecurity ?? 'NO ENCONTRADA'}, policies=${JSON.stringify(policies)}`);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
