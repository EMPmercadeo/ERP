/**
 * ERP Panamá - Database Client
 * 
 * Self-Hosted: Prisma + PostgreSQL
 * Future Cloud: Firebase/Firestore
 * 
 * Este archivo exporta el cliente de base de datos.
 * Prisma 7+ requiere configuración en prisma.config.ts
 */

import { PrismaClient } from '@prisma/client';
import { validateEnv } from '@/lib/env-validator';

// Validar variables de entorno antes de levantar el cliente de BD
validateEnv();

// Prevenir múltiples instancias en desarrollo (y reutilizar la misma instancia entre
// invocaciones "warm" de una misma función serverless en producción — ver más abajo).
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// En Vercel (serverless) cada instancia de función mantiene su propio pool de conexiones
// de Prisma. Bajo carga concurrente, Vercel puede levantar muchas instancias en paralelo;
// sin un límite explícito por instancia, la suma de esos pools puede agotar el límite de
// conexiones de Postgres (especialmente en el free tier de Supabase), provocando 503
// intermitentes en server actions aunque el código y los datos sean correctos. Forzamos
// un pool pequeño por instancia si el connection string no lo especifica ya.
function buildDatasourceUrl(): string | undefined {
    const url = process.env.DATABASE_URL;
    if (!url) return undefined;
    try {
        const parsed = new URL(url);
        if (!parsed.searchParams.has('connection_limit')) {
            parsed.searchParams.set('connection_limit', '3');
        }
        if (!parsed.searchParams.has('pool_timeout')) {
            parsed.searchParams.set('pool_timeout', '15');
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: buildDatasourceUrl(),
});

// Cachear también en producción: el módulo persiste entre invocaciones "warm" de un mismo
// contenedor serverless, así que reutilizar la instancia evita abrir pools adicionales
// innecesarios dentro del mismo proceso.
globalForPrisma.prisma = prisma;

// Re-exportar el cliente para acceso fácil
export default prisma;

// Tipos se generan automáticamente y se pueden importar desde @prisma/client
// import type { Empresa, Factura, etc. } from '@prisma/client';
