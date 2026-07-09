import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { z } from 'zod';

const PlanSchema = z.object({
  nombre: z.string().min(2, 'Nombre de plan obligatorio'),
  slug: z.string().min(2, 'Slug obligatorio'),
  precio: z.number().min(0, 'Precio no puede ser negativo'),
  facturasIncluidas: z.number().int().min(0).default(100),
  maxUsers: z.number().int().min(1).default(5),
  activo: z.boolean().default(true),
  featuresJson: z.any().optional().default({})
});

export async function GET(request: NextRequest) {
  try {
    const planes = await prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
      include: {
        _count: {
          select: { cuentas: true, subscriptions: true }
        }
      }
    });

    return NextResponse.json(planes);
  } catch (error: any) {
    console.error('Error GET /api/admin/planes:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener planes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validacion = PlanSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { nombre, slug, precio, facturasIncluidas, maxUsers, activo, featuresJson } = validacion.data;

    const existe = await prisma.plan.findUnique({ where: { slug } });
    if (existe) {
      return NextResponse.json({ error: 'Ya existe un plan con ese slug' }, { status: 409 });
    }

    const nuevoPlan = await prisma.plan.create({
      data: {
        name: nombre,
        nombre,
        slug,
        priceMonthly: precio,
        precio,
        includedDocuments: facturasIncluidas,
        facturasIncluidas,
        maxUsers,
        isActive: activo,
        activo,
        featuresJson
      }
    });

    await registrarLogAuditoria({
      adminId: request.headers.get('x-admin-id') || 'SUPERADMIN',
      accion: 'CREAR_PLAN',
      objetivo: 'Plan',
      objetivoId: nuevoPlan.id,
      detalles: { nombre, precio, facturasIncluidas }
    });

    return NextResponse.json(nuevoPlan, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/admin/planes:', error);
    return NextResponse.json({ error: error.message || 'Error al crear plan' }, { status: 500 });
  }
}
