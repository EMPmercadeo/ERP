import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paginar } from '@/lib/paginar';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { enviarCorreoSuperadmin } from '@/lib/correo';
import { z } from 'zod';

const CrearUsuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  empresa: z.string().min(2, 'La empresa es obligatoria'),
  ruc: z.string().min(3, 'El RUC es obligatorio'),
  correo: z.string().email('Correo electrónico inválido'),
  telefono: z.string().optional(),
  planId: z.string().optional(),
  saldoInicial: z.number().int().min(0).default(100)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const take = parseInt(searchParams.get('take') || '20', 10);
    const q = searchParams.get('q') || '';
    const planId = searchParams.get('planId');
    const estado = searchParams.get('estado');
    const incluirEliminados = searchParams.get('incluirEliminados') === 'true';

    const where: any = {};
    if (!incluirEliminados) {
      where.eliminadoEn = null;
    }

    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { empresa: { contains: q, mode: 'insensitive' } },
        { ruc: { contains: q, mode: 'insensitive' } },
        { correo: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (planId && planId !== 'all') {
      where.planId = planId;
    }

    if (estado && estado !== 'all') {
      where.estado = estado;
    }

    const resultado = await paginar(prisma.cuenta, {
      cursor,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        _count: {
          select: { facturas: true, tickets: true, pagos: true }
        }
      }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error GET /api/admin/usuarios:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validacion = CrearUsuarioSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { nombre, empresa, ruc, correo, telefono, planId, saldoInicial } = validacion.data;

    // Verificar si existe RUC o correo
    const existe = await prisma.cuenta.findFirst({
      where: { OR: [{ ruc }, { correo }] }
    });

    if (existe) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este RUC o Correo electrónico.' }, { status: 409 });
    }

    const nuevaCuenta = await prisma.cuenta.create({
      data: {
        nombre,
        empresa,
        ruc,
        correo,
        telefono: telefono || null,
        planId: planId || null,
        saldoFacturas: saldoInicial,
        estado: 'ACTIVA'
      },
      include: { plan: true }
    });

    // Registrar en auditoría
    await registrarLogAuditoria({
      adminId: request.headers.get('x-admin-id') || 'SUPERADMIN',
      accion: 'CREAR_CUENTA',
      objetivo: 'Cuenta',
      objetivoId: nuevaCuenta.id,
      detalles: { ruc, correo, empresa, saldoInicial }
    });

    // Registrar movimiento de cuota inicial si corresponde
    if (saldoInicial > 0) {
      await prisma.movimientoCuota.create({
        data: {
          cuentaId: nuevaCuenta.id,
          tipo: 'CREDITO_COMPRA',
          cantidad: saldoInicial,
          saldoAnte: 0,
          saldoPost: saldoInicial,
          nota: 'Acreditación inicial de saldo al crear cuenta manual'
        }
      });
    }

    // Enviar correo de bienvenida transaccional
    await enviarCorreoSuperadmin({
      cuentaId: nuevaCuenta.id,
      destinatario: correo,
      asunto: `¡Bienvenido a ERP Panamá, ${nombre}!`,
      plantillaClave: 'BIENVENIDA',
      variables: {
        nombre,
        empresa,
        ruc,
        saldo: saldoInicial
      },
      cuerpoLibre: `<p>Hola <strong>${nombre}</strong>,</p><p>Tu cuenta para la empresa <strong>${empresa}</strong> (RUC: ${ruc}) ha sido creada con éxito por el Superadministrador.</p><p>Se han acreditado <strong>${saldoInicial}</strong> cuotas de facturas electrónicas en tu saldo inicial.</p>`
    });

    return NextResponse.json(nuevaCuenta, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/admin/usuarios:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
