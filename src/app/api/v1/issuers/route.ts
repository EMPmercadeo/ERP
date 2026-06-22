import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const body = await request.json();
        const { ruc, dv, razonSocial, direccion, telefono, email } = body;

        if (!ruc || !dv || !razonSocial || !direccion) {
            return NextResponse.json({ error: 'RUC, DV, Razón Social y Dirección son campos obligatorios.' }, { status: 400 });
        }

        const updatedEmpresa = await prisma.$transaction(async (tx) => {
            const emp = await tx.empresa.update({
                where: { id: empresaId },
                data: { ruc, dv, razonSocial, direccion, telefono, email }
            });

            const defaultBranch = await tx.sucursal.findFirst({
                where: { empresaId: emp.id, codigo: '001' }
            });

            if (!defaultBranch) {
                await tx.sucursal.create({
                    data: {
                        empresaId: emp.id,
                        codigo: '001',
                        nombre: 'Casa Matriz',
                        direccion: direccion,
                        activa: true
                    }
                });
            } else {
                await tx.sucursal.update({
                    where: { id: defaultBranch.id },
                    data: { direccion }
                });
            }

            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Empresa',
                    entidadId: emp.id,
                    accion: 'editar',
                    datosDespues: JSON.parse(JSON.stringify(emp))
                }
            });

            return emp;
        });

        return NextResponse.json({ success: true, data: updatedEmpresa });
    } catch (error) {
        console.error('API error in /issuers:', error);
        return NextResponse.json({ error: 'Error al actualizar los datos del emisor.' }, { status: 500 });
    }
}