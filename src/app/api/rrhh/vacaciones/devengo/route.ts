import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, empleadoId } = body;

    if (!empresaId && !empleadoId) {
      return NextResponse.json({ error: 'Debe especificar empresaId o empleadoId para aplicar devengo' }, { status: 400 });
    }

    const where: any = { activo: true };
    if (empleadoId) where.id = empleadoId;
    else if (empresaId) where.empresaId = empresaId;

    const empleados = await prisma.empleado.findMany({
      where,
      include: { movVacaciones: true }
    });

    // Regla de Código de Trabajo de Panamá: 30 días de vacaciones por cada 11 meses trabajados
    // Equivalencia mensual exacta: 30 / 11 = 2.72727... redondeado a 2.73 días por mes trabajado
    const devengoMensual = 2.73;
    const movimientos = [];

    for (const emp of empleados) {
      const saldoActual = emp.movVacaciones.reduce((acc, mov) => acc + Number(mov.dias), 0);
      const nuevoSaldo = Number((saldoActual + devengoMensual).toFixed(2));

      const mov = await prisma.movimientoVacaciones.create({
        data: {
          empleadoId: emp.id,
          tipo: 'DEVENGO',
          dias: devengoMensual,
          saldoPosterior: nuevoSaldo,
          referencia: `Devengo mensual de vacaciones (Ley 30 días/11 meses ≈ 2.73 días/mes) - ${new Date().toLocaleDateString('es-PA', { month: 'long', year: 'numeric' })}`
        }
      });
      movimientos.push(mov);
    }

    if (empresaId) {
      await registrarLogAuditoria({
        adminId: empresaId,
        accion: 'DEVENGO_VACACIONES_MASIVO',
        objetivo: 'Empresa',
        objetivoId: empresaId,
        detalles: { empleadosProcesados: empleados.length, devengoPorEmpleado: devengoMensual },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      });
    }

    return NextResponse.json({
      success: true,
      message: `Devengo de vacaciones aplicado exitosamente a ${empleados.length} colaboradores activos`,
      movimientos
    });
  } catch (error: any) {
    console.error('Error POST /api/rrhh/vacaciones/devengo:', error);
    return NextResponse.json({ error: 'Error al procesar devengo de vacaciones' }, { status: 500 });
  }
}
