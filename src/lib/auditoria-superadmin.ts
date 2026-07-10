import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export interface RegistrarAuditoriaParams {
  adminId: string;
  accion: string;
  objetivo: string;
  objetivoId?: string | null;
  detalles?: Prisma.InputJsonValue;
  ip?: string | null;
}

export async function registrarLogAuditoria({
  adminId,
  accion,
  objetivo,
  objetivoId,
  detalles,
  ip
}: RegistrarAuditoriaParams) {
  try {
    const log = await prisma.logAuditoria.create({
      data: {
        adminId: adminId || 'SYSTEM_SUPERADMIN',
        accion,
        objetivo,
        objetivoId: objetivoId || null,
        detalles: detalles ?? {},
        ip: ip || null
      }
    });
    return log;
  } catch (error) {
    console.error('Error al registrar auditoria de superadmin:', error);
    return null;
  }
}
