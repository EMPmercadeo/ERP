import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

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

        if (!invoice.empresa.certificadoDgi) {
            return NextResponse.json({
                error: 'Certificado de firma electrónica no registrado para la empresa.',
                code: '0922',
                status: 'rejected_schema'
            }, { status: 400 });
        }

        const mockSignedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<rDE xmlns="http://dgi.mef.gob.pa/DocumentoElectronico">\n' +
            '    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">\n' +
            '        <DigestValue>dGhpcyBpcyBhIG1vY2sgc2lnbmVkIHhtbCBmb3IgcGFuYW1h</DigestValue>\n' +
            '    </Signature>\n' +
            '    <gDE>\n' +
            '        <dNumDoc>' + invoice.numeroCompleto + '</dNumDoc>\n' +
            '        <dFecEmis>' + invoice.fechaEmision.toISOString() + '</dFecEmis>\n' +
            '    </gDE>\n' +
            '</rDE>';

        const updated = await prisma.$transaction(async (tx) => {
            const inv = await tx.factura.update({
                where: { id },
                data: {
                    xmlContent: mockSignedXml
                }
            });

            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Factura',
                    entidadId: id,
                    accion: 'editar',
                    datosDespues: { signed: true }
                }
            });

            return inv;
        });

        return NextResponse.json({
            success: true,
            status: 'signed',
            xmlContent: mockSignedXml
        });

    } catch (error) {
        console.error('API error in /sign:', error);
        return NextResponse.json({ error: 'Error durante la firma del documento.' }, { status: 500 });
    }
}