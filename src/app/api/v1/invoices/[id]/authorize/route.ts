import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

async function getNextSequence(empresaId: string, sucursalId: string, cajaId: string) {
    return await prisma.$transaction(async (tx) => {
        const sequence = await tx.secuencia.findUnique({
            where: {
                empresaId_sucursalId_cajaId_tipoDocumento: {
                    empresaId,
                    sucursalId,
                    cajaId,
                    tipoDocumento: 'FE'
                }
            }
        });

        let nextNumber = 1;
        if (sequence) {
            nextNumber = sequence.ultimoNumero + 1;
            await tx.secuencia.update({
                where: { id: sequence.id },
                data: { ultimoNumero: nextNumber }
            });
        } else {
            await tx.secuencia.create({
                data: {
                    empresaId,
                    sucursalId,
                    cajaId,
                    tipoDocumento: 'FE',
                    ultimoNumero: nextNumber
                }
            });
        }
        return nextNumber;
    });
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const { id } = await props.params;

        const invoice = await prisma.factura.findFirst({
            where: { id, empresaId },
            include: { empresa: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }

        const seq = await getNextSequence(empresaId, invoice.sucursalId, invoice.cajaId);
        const seqStr = String(seq).padStart(8, '0');
        const prefix = invoice.empresa.planType === 'free' ? 'REC' : 'FE';
        let numeroCompleto = '';
        if (invoice.empresa.planType !== 'free') {
            numeroCompleto = prefix + '-001-001-01-' + seqStr;
        } else {
            numeroCompleto = prefix + '-' + seqStr;
        }

        const mockCufe = prefix + '2026' + invoice.empresa.ruc.replace(/\-/g, '') + '01' + seqStr + '12345678';
        const mockQrUrl = 'https://dgi-fep.mef.gob.pa/consultas/factura?cufe=' + mockCufe;

        const updated = await prisma.$transaction(async (tx) => {
            const inv = await tx.factura.update({
                where: { id },
                data: {
                    numeroSecuencial: seq,
                    numeroCompleto,
                    estadoDgi: 'aceptada',
                    cufe: mockCufe,
                    qrUrl: mockQrUrl,
                    fechaAceptacion: new Date(),
                    errorDgi: null
                }
            });

            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Factura',
                    entidadId: id,
                    accion: 'editar',
                    datosDespues: {
                        estadoDgi: 'aceptada',
                        cufe: mockCufe,
                        numeroCompleto
                    }
                }
            });

            return inv;
        });

        return NextResponse.json({
            success: true,
            status: 'authorized',
            code: '0920',
            message: 'Factura recibida y autorizada con éxito.',
            data: updated
        });

    } catch (error) {
        console.error('API error in /authorize:', error);
        return NextResponse.json({ error: 'Error durante la autorización del PAC/DGI.' }, { status: 500 });
    }
}