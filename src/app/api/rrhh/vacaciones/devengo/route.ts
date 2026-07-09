import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';
import { getTenantContext } from '@/lib/auth/context';

export async function POST(request: NextRequest) {
  try {
    // Este endpoint no tenía NINGUNA autenticación: cualquiera, sin sesión, podía mandar un
    // empresaId ajeno y acreditar vacaciones masivamente a otra empresa. Ahora empresaId
    // siempre sale de la sesión; empleadoId (si se manda) se valida contra esa misma empresa.
    let empresaId: string;
    let userId: string;
    try {
      ({ empresaId, userId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para aplicar el devengo de vacaciones.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { empleadoId } = body;

    if (empleadoId) {
      const empleadoObjetivo = await prisma.empleado.findUnique({ where: { id: empleadoId } });
      if (!empleadoObjetivo || empleadoObjetivo.empresaId !== empresaId) {
        return NextResponse.json({ error: 'Colaborador no encontrado en tu empresa.' }, { status: 404 });
      }
    }

    const where: any = { activo: true, empresaId };
    if (empleadoId) where.id = empleadoId;

    const empleados = await prisma.empleado.findMany({
      where,
      include: { movVacaciones: true }
    });

    // Regla de Código de Trabajo de Panamá: 30 días de vacaciones por cada 11 meses trabajados
    // Equivalencia mensual exacta: 30 / 11 = 2.72727... redondeado a 2.73 días por mes trabajado
    const devengoMensual = 2.73;
    const movimientos = [];
    const omitidos = [];

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    for (const emp of empleados) {
      // Idempotencia: si ya se aplicó un devengo este mes calendario para este colaborador, se omite
      const yaDevengadoEsteMes = emp.movVacaciones.some(
        mov => mov.tipo === 'DEVENGO' && mov.createdAt >= inicioMes
      );
      if (yaDevengadoEsteMes) {
        omitidos.push(emp.id);
        continue;
      }

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

    await registrarLogAuditoria({
      adminId: userId,
      accion: 'DEVENGO_VACACIONES_MASIVO',
      objetivo: 'Empresa',
      objetivoId: empresaId,
      detalles: { empleadosProcesados: movimientos.length, omitidosPorDuplicado: omitidos.length, devengoPorEmpleado: devengoMensual },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: `Devengo de vacaciones aplicado a ${movimientos.length} colaboradores. ${omitidos.length} ya tenían el devengo de este mes aplicado y fueron omitidos.`,
      movimientos,
      omitidos
    });
  } catch (error: any) {
    console.error('Error POST /api/rrhh/vacaciones/devengo:', error);
    return NextResponse.json({ error: 'Error al procesar devengo de vacaciones' }, { status: 500 });
  }
}
