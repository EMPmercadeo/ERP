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

// Prevenir múltiples instancias en desarrollo
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    (globalForPrisma.prisma && (globalForPrisma.prisma as any).proveedor && (globalForPrisma.prisma as any).compra)
        ? globalForPrisma.prisma
        : new PrismaClient({
              log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
          });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-exportar el cliente para acceso fácil
export default prisma;

// Tipos se generan automáticamente y se pueden importar desde @prisma/client
// import type { Empresa, Factura, etc. } from '@prisma/client';
