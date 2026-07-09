import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    const cuentas = await prisma.cuenta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        _count: { select: { facturas: true, pagos: true, tickets: true } }
      }
    });

    await registrarLogAuditoria({
      adminId: request.headers.get('x-admin-id') || 'SUPERADMIN',
      accion: 'EXPORTAR_USUARIOS_CSV',
      objetivo: 'Cuenta',
      detalles: { cantidad: cuentas.length, filtros: { q, planId, estado } }
    });

    const cabecera = ['ID', 'Nombre', 'Empresa', 'RUC', 'Correo', 'Teléfono', 'Estado', 'Plan', 'Saldo Facturas', 'Facturas Emitidas', 'Tickets', 'Fecha Creación', 'Eliminado En'];
    const filas = cuentas.map(c => [
      c.id,
      `"${(c.nombre || '').replace(/"/g, '""')}"`,
      `"${(c.empresa || '').replace(/"/g, '""')}"`,
      `"${c.ruc}"`,
      `"${c.correo}"`,
      `"${c.telefono || ''}"`,
      c.estado,
      `"${c.plan?.nombre || c.plan?.name || 'Sin Plan'}"`,
      c.saldoFacturas,
      c._count.facturas,
      c._count.tickets,
      c.createdAt.toISOString().split('T')[0],
      c.eliminadoEn ? c.eliminadoEn.toISOString().split('T')[0] : 'No'
    ]);

    const csvContent = [cabecera.join(','), ...filas.map(f => f.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="usuarios-erp-panama-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/usuarios/export:', error);
    return NextResponse.json({ error: error.message || 'Error interno al exportar CSV' }, { status: 500 });
  }
}
