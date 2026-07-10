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
                const nuevaSucursal = await tx.sucursal.create({
                    data: {
                        empresaId: emp.id,
                        codigo: '001',
                        nombre: 'Casa Matriz',
                        direccion: direccion,
                        activa: true
                    }
                });

                await tx.caja.create({
                    data: {
                        empresaId: emp.id,
                        sucursalId: nuevaSucursal.id,
                        codigo: '001',
                        nombre: 'Caja Principal',
                        activa: true,
                    }
                });

                await tx.bodega.create({
                    data: {
                        empresaId: emp.id,
                        sucursalId: nuevaSucursal.id,
                        codigo: '001',
                        nombre: 'Bodega Principal',
                        activa: true,
                    }
                });
            } else {
                // Ensure Caja Principal exists
                const defaultCaja = await tx.caja.findFirst({
                    where: { sucursalId: defaultBranch.id, codigo: '001' }
                });
                if (!defaultCaja) {
                    await tx.caja.create({
                        data: {
                            empresaId: emp.id,
                            sucursalId: defaultBranch.id,
                            codigo: '001',
                            nombre: 'Caja Principal',
                            activa: true,
                        }
                    });
                }

                // Ensure Bodega Principal exists
                const defaultBodega = await tx.bodega.findFirst({
                    where: { sucursalId: defaultBranch.id, codigo: '001' }
                });
                if (!defaultBodega) {
                    await tx.bodega.create({
                        data: {
                            empresaId: emp.id,
                            sucursalId: defaultBranch.id,
                            codigo: '001',
                            nombre: 'Bodega Principal',
                            activa: true,
                        }
                    });
                }

                await tx.sucursal.update({
                    where: { id: defaultBranch.id },
                    data: { direccion }
                });
            }

            // No se audita el objeto `emp` completo: incluye certificadoDgi (llave privada
            // .p12 en base64) y passwordPac (cifrada, pero sin necesidad de quedar en el log).
            // Solo se registran los campos de negocio que realmente cambiaron aquí.
            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Empresa',
                    entidadId: emp.id,
                    accion: 'editar',
                    datosDespues: { ruc: emp.ruc, dv: emp.dv, razonSocial: emp.razonSocial, direccion: emp.direccion, telefono: emp.telefono, email: emp.email }
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