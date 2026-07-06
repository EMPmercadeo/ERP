import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { crearFacturaCompleta, FacturaCreationError } from '@/lib/services/invoiceCreation';

export const dynamic = 'force-dynamic';

interface InvoiceItemInput {
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    codigoTasaItbms: string;
    descuento?: number;
}

export async function POST(request: NextRequest) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const body = await request.json();
        const { clienteId, items, condicionPago, metodoPago } = body;

        if (!clienteId || !items || items.length === 0) {
            return NextResponse.json({ error: 'clienteId e items son requeridos.' }, { status: 400 });
        }

        const invoice = await crearFacturaCompleta({
            empresaId,
            userId,
            clienteId,
            condicionPago: condicionPago || 'contado',
            metodoPago,
            bodegaId: null,
            items: items as InvoiceItemInput[]
        });

        // Auditoría específica de este endpoint: a diferencia de los flujos internos (UI, POS),
        // las escrituras de la API externa quedan registradas explícitamente para trazabilidad
        // de integradores de terceros.
        await prisma.auditoria.create({
            data: {
                usuarioId: userId,
                entidad: 'Factura',
                entidadId: invoice.id,
                accion: 'crear',
                datosDespues: { numeroCompleto: invoice.numeroCompleto, totalNeto: Number(invoice.totalNeto), source: 'api-externa' }
            }
        });

        return NextResponse.json({ success: true, data: invoice });
    } catch (error) {
        if (error instanceof FacturaCreationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('API error in POST /invoices:', error);
        return NextResponse.json({ error: 'Error al crear la factura.' }, { status: 500 });
    }
}
