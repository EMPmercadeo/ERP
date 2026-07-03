import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getTenantContext } from '@/lib/auth/context';

/**
 * Tenant-aware data access layer.
 * Enforces `empresaId` filter on all queries.
 */
export const prismaApp = {
    factura: {
        findMany: async (args: Prisma.FacturaFindManyArgs = {}) => {
            const ctx = await getTenantContext();
            return prisma.factura.findMany({
                ...args,
                where: {
                    ...args.where,
                    empresaId: ctx.empresaId
                }
            });
        },
        findFirst: async (args: Prisma.FacturaFindFirstArgs = {}) => {
            const ctx = await getTenantContext();
            return prisma.factura.findFirst({
                ...args,
                where: {
                    ...args.where,
                    empresaId: ctx.empresaId
                }
            });
        },
        create: async (args: Prisma.FacturaCreateArgs) => {
            const ctx = await getTenantContext();
            // Force empresaId
            return prisma.factura.create({
                ...args,
                data: {
                    ...(args.data as Prisma.FacturaUncheckedCreateInput),
                    empresaId: ctx.empresaId
                }
            });
        },
        count: async (args: Prisma.FacturaCountArgs = {}) => {
            const ctx = await getTenantContext();
            return prisma.factura.count({
                ...args,
                where: {
                    ...args.where,
                    empresaId: ctx.empresaId
                }
            });
        }
    },
    cliente: {
        findMany: async (args: Prisma.ClienteFindManyArgs = {}) => {
            const ctx = await getTenantContext();
            return prisma.cliente.findMany({
                ...args,
                where: {
                    ...args.where,
                    empresaId: ctx.empresaId
                }
            });
        },
        findFirst: async (args: Prisma.ClienteFindFirstArgs = {}) => {
            const ctx = await getTenantContext();
            return prisma.cliente.findFirst({
                ...args,
                where: {
                    ...args.where,
                    empresaId: ctx.empresaId
                }
            });
        },
        // ... add other methods as needed
    },
    producto: {
        findMany: async (args: Prisma.ProductoFindManyArgs = {}) => {
            const ctx = await getTenantContext();
            return prisma.producto.findMany({
                ...args,
                where: {
                    ...args.where,
                    empresaId: ctx.empresaId
                }
            });
        }
    }
    // TODO: Add other models (Cotizacion, Pago, etc)
};
