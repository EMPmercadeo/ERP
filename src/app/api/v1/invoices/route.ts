import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

interface InvoiceItemInput {
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    codigoTasaItbms: string;
}

export async function POST(request: NextRequest) {
    try {
        const { empresaId, userId } = await getTenantContext();
        const body = await request.json();
        const { clienteId, items, condicionPago, observaciones } = body;

        if (!clienteId || !items || items.length === 0) {
            return NextResponse.json({ error: 'clienteId e items son requeridos.' }, { status: 400 });
        }

        const itemsList = items as InvoiceItemInput[];

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            include: { sucursales: { include: { cajas: true } } }
        });

        if (!empresa || !empresa.sucursales[0] || !empresa.sucursales[0].cajas[0]) {
            return NextResponse.json({ error: 'Configuración de empresa, sucursal o caja incompleta.' }, { status: 500 });
        }

        const sucursal = empresa.sucursales[0];
        const caja = sucursal.cajas[0];

        // Billing limits check
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const invoiceCount = await prisma.factura.count({
            where: { empresaId, fechaEmision: { gte: startOfMonth } }
        });

        if (empresa.planType === 'free' && invoiceCount >= 100) {
            return NextResponse.json({ error: 'Límite mensual del plan Gratuito Asistido alcanzado (100 docs).' }, { status: 403 });
        }
        if (empresa.planType === 'basic' && invoiceCount >= 100) {
            return NextResponse.json({ error: 'Límite mensual del plan Básico PAC alcanzado (100 docs).' }, { status: 403 });
        }
        if (empresa.planType === 'pro' && invoiceCount >= 500) {
            return NextResponse.json({ error: 'Límite mensual del plan Pro PAC alcanzado (500 docs).' }, { status: 403 });
        }

        const subtotal = itemsList.reduce((sum: number, item: InvoiceItemInput) => sum + (item.cantidad * item.precioUnitario), 0);
        const totalItbms = itemsList.reduce((sum: number, item: InvoiceItemInput) => {
            const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                         item.codigoTasaItbms === '02' ? 0.10 :
                         item.codigoTasaItbms === '03' ? 0.15 : 0;
            return sum + (item.cantidad * item.precioUnitario * tasa);
        }, 0);
        const totalNeto = subtotal + totalItbms;

        // Generate temporary unique number
        const tempSec = Date.now();
        const numeroCompleto = 'TEMP-' + tempSec;

        const invoice = await prisma.$transaction(async (tx) => {
            const inv = await tx.factura.create({
                data: {
                    empresaId: empresa.id,
                    sucursalId: sucursal.id,
                    cajaId: caja.id,
                    clienteId,
                    creadorId: userId,
                    tipoDocumento: 'FE',
                    numeroSecuencial: 0,
                    numeroCompleto,
                    subtotal,
                    totalItbms,
                    totalNeto,
                    saldoPendiente: condicionPago === 'contado' ? 0 : totalNeto,
                    totalPagado: condicionPago === 'contado' ? totalNeto : 0,
                    estadoDgi: 'borrador',
                    items: {
                        create: itemsList.map((item: InvoiceItemInput) => ({
                            productoId: item.productoId,
                            descripcion: item.descripcion,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            costoUnitario: 0,
                            codigoTasaItbms: item.codigoTasaItbms,
                            montoItbms: item.cantidad * item.precioUnitario * (item.codigoTasaItbms === '01' ? 0.07 : 0),
                            montoTotal: item.cantidad * item.precioUnitario * (1 + (item.codigoTasaItbms === '01' ? 0.07 : 0))
                        }))
                    }
                },
                include: { items: true }
            });

            await tx.auditoria.create({
                data: {
                    usuarioId: userId,
                    entidad: 'Factura',
                    entidadId: inv.id,
                    accion: 'crear',
                    datosDespues: JSON.parse(JSON.stringify(inv))
                }
            });

            return inv;
        });

        return NextResponse.json({ success: true, data: invoice });
    } catch (error) {
        console.error('API error in POST /invoices:', error);
        return NextResponse.json({ error: 'Error al crear la prefactura.' }, { status: 500 });
    }
}