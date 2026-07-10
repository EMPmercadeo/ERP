import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

// DEPRECADO: este endpoint generaba un XML "firmado" fabricado en el servidor (sin firmar nada
// realmente) y lo guardaba como si fuera válido — con un PAC real conectado, cualquier cliente
// que hubiera consultado ese XML habría recibido un documento fraudulento. En la arquitectura
// real (src/lib/facturacion-electronica + timbrarFacturaDGI), el PAC firma y autoriza el
// documento en un solo paso — no existe un paso de "solo firmar" por separado. Se deja este
// endpoint respondiendo con claridad en vez de fabricar contenido falso, para no romper
// integradores existentes que aún lo llamen.
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { empresaId } = await getTenantContext();
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

        return NextResponse.json({
            error: 'Este paso fue combinado con /authorize: el PAC firma y autoriza el documento en una sola operación. Llama a POST /api/v1/invoices/{id}/authorize directamente.',
            status: 'deprecated'
        }, { status: 410 });

    } catch (error) {
        console.error('API error in /sign:', error);
        return NextResponse.json({ error: 'Error durante la firma del documento.' }, { status: 500 });
    }
}