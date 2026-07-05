import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local', override: true });

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const MIGRATION_DIR = '20260705141500_enable_rls_facturacion_electronica';

async function main() {
    const dbUrl = process.env.DATABASE_URL || '';
    const host = new URL(dbUrl).host;
    if (!host.includes('supabase') && !host.includes('pooler')) {
        throw new Error(`Host inesperado, no parece producción: ${host}`);
    }
    console.log(`Conectado a host: ${host}`);

    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', MIGRATION_DIR, 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    const statements = sql
        .split('\n')
        .filter((line) => line.trim() && !line.trim().startsWith('--'))
        .join('\n')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

    console.log(`${statements.length} sentencias a aplicar.`);

    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    try {
        await prisma.$transaction(
            async (tx) => {
                for (const stmt of statements) {
                    console.log(`Ejecutando: ${stmt}`);
                    await tx.$executeRawUnsafe(stmt);
                }
            },
            { timeout: 30000 }
        );
        console.log('✅ Migración aplicada correctamente.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
});
