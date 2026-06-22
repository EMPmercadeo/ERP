import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const body = await request.json();
        const { certificadoDgi } = body;

        if (!certificadoDgi) {
            return NextResponse.json({ error: 'certificadoDgi es requerido.' }, { status: 400 });
        }

        const updated = await prisma.$transaction(async (tx) => {
            const emp = await tx.empresa.update({
                where: { id: empresaId },
                data: { certificadoDgi }
            });

            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Empresa',
                    entidadId: empresaId,
                    accion: 'editar',
                    datosDespues: { certificadoDgi }
                }
            });
            return emp;
        });

        return NextResponse.json({ success: true, data: { certificadoDgi: updated.certificadoDgi } });
    } catch (error) {
        return NextResponse.json({ error: 'Error al registrar el certificado.' }, { status: 500 });
    }
}