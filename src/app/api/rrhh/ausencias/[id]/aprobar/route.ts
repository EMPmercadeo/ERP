import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrarLogAuditoria } from '@/lib/auditoria-superadmin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado, aprobadaPor, nota } = body; // 'APROBADA' | 'RECHAZADA'

    if (!estado || !['APROBADA', 'RECHAZADA'].includes(estado)) {
      return NextResponse.json({ error: 'Estado de aprobación inválido' }, { status: 400 });
    }

    const ausencia = await prisma.ausencia.findUnique({
      where: { id },
      include: { empleado: { include: { movVacaciones: true } } }
    });

    if (!ausencia) {
      return NextResponse.json({ error: 'Ausencia no encontrada' }, { status: 404 });
    }

    if (ausencia.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: `La ausencia ya se encuentra en estado ${ausencia.estado}` }, { status: 400 });
    }

    // Actualizar estado de la ausencia
    const actualizada = await prisma.ausencia.update({
      where: { id },
      data: {
        estado,
        aprobadaPor: aprobadaPor || 'Supervisor RRHH',
        nota: nota || ausencia.nota
      }
    });

    // Si se APROBÓ y es de tipo VACACIONES, insertamos un movimiento en el Ledger (TOMA)
    if (estado === 'APROBADA' && ausencia.tipo === 'VACACIONES') {
      const saldoActual = ausencia.empleado.movVacaciones.reduce((acc, mov) => {
        return acc + Number(mov.dias);
      }, 0);

      const nuevoSaldo = saldoActual - ausencia.dias;

      await prisma.movimientoVacaciones.create({
        data: {
          empleadoId: ausencia.empleadoId,
          tipo: 'TOMA',
          dias: -ausencia.dias,
          saldoPosterior: Number(nuevoSaldo.toFixed(2)),
          referencia: `Vacaciones tomadas del ${ausencia.desde.toLocaleDateString()} al ${ausencia.hasta.toLocaleDateString()} (Ausencia ID: ${ausencia.id})`
        }
      });
    }

    // Auditoría
    await registrarLogAuditoria({
      adminId: ausencia.empleado.empresaId,
      accion: `RESOLVER_AUSENCIA_${estado}`,
      objetivo: 'Ausencia',
      objetivoId: ausencia.id,
      detalles: {
        empleado: ausencia.empleado.nombre,
        tipo: ausencia.tipo,
        dias: ausencia.dias,
        resolucion: estado,
        aprobadaPor
      },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, ausencia: actualizada });
  } catch (error: any) {
    console.error('Error POST /api/rrhh/ausencias/[id]/aprobar:', error);
    return NextResponse.json({ error: 'Error al procesar resolución de ausencia' }, { status: 500 });
  }
}
