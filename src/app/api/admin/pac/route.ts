import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { requireSuperAdminApi } from '@/lib/auth/admin';
import { encrypt as cifrar } from '@/lib/utils/crypto';
import { z } from 'zod';

const PACSchema = z.object({
  proveedor: z.string().min(2, 'Proveedor requerido'),
  ambiente: z.enum(['TEST', 'PRODUCCION']).default('TEST'),
  credenciales: z.string().min(1, 'Credenciales requeridas'),
  esRespaldo: z.boolean().default(false),
  activo: z.boolean().default(true)
});

export async function GET(_request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const configs = await prisma.configuracionPAC.findMany({
      orderBy: { esRespaldo: 'asc' }
    });

    // Enmascarar credenciales para nunca ser enviadas en texto plano al cliente frontend
    const seguras = configs.map(c => ({
      id: c.id,
      proveedor: c.proveedor,
      ambiente: c.ambiente,
      esRespaldo: c.esRespaldo,
      activo: c.activo,
      actualizadoEn: c.actualizadoEn,
      hasCredentials: Boolean(c.credenciales && c.credenciales.length > 0),
      credencialesMasked: '••••••••••••••••'
    }));

    return NextResponse.json(seguras);
  } catch (error) {
    console.error('Error GET /api/admin/pac:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener configuraciones PAC' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminApi();
  if ('error' in auth) return auth.error;
  try {
    const adminId = auth.context.userId;
    const body = await request.json();
    const validacion = PACSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { proveedor, ambiente, credenciales, esRespaldo, activo } = validacion.data;

    // Si no se marca como respaldo, desmarcamos los demás o nos aseguramos que solo uno sea el primario
    if (!esRespaldo) {
      await prisma.configuracionPAC.updateMany({
        where: { esRespaldo: false },
        data: { esRespaldo: true }
      });
    }

    const nuevoPAC = await prisma.configuracionPAC.create({
      data: {
        proveedor,
        ambiente,
        credenciales: cifrar(credenciales),
        esRespaldo,
        activo
      }
    });

    await registrarLogAuditoria({
      adminId,
      accion: 'CREAR_CONFIGURACION_PAC',
      objetivo: 'ConfiguracionPAC',
      objetivoId: nuevoPAC.id,
      detalles: { proveedor, ambiente, esRespaldo }
    });

    return NextResponse.json({
      ...nuevoPAC,
      credenciales: '••••••••••••••••',
      hasCredentials: true
    }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/pac:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear PAC' }, { status: 500 });
  }
}
