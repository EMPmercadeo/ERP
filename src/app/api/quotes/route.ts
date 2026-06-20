import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { client, items, totals, notes, terms, validUntil } = body;

        // Mock Auth
        const companyId = "cm6s25dti000008l102cz361a";
        // We need a valid user ID. Let's find one or use a real mock from seed if known.
        // For robustness, let's find the first user of the company.
        const user = await prisma.usuario.findFirst({ where: { empresaId: companyId } });
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 500 });

        const sucursal = await prisma.sucursal.findFirst({ where: { empresaId: companyId } });
        if (!sucursal) return NextResponse.json({ error: 'Configuración de empresa incompleta (Sucursal)' }, { status: 500 });

        const caja = await prisma.caja.findFirst({ where: { sucursalId: sucursal.id } });
        if (!caja) return NextResponse.json({ error: 'Configuración de empresa incompleta (Caja)' }, { status: 500 });

        // 1. Validation
        if (!client || !client.id) {
            return NextResponse.json({ error: 'Cliente es requerido' }, { status: 400 });
        }
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Debe agregar al menos un ítem' }, { status: 400 });
        }

        // 2. Handle Ad-Hoc Items (Generic Product Fallback)
        // Check if we have a generic product, else create/find one.
        let genericProduct = await prisma.producto.findFirst({
            where: {
                empresaId: companyId,
                codigoInterno: 'GENERICO'
            }
        });

        if (!genericProduct) {
            // Fallback: try to find ANY product or create one
            const anyProduct = await prisma.producto.findFirst({ where: { empresaId: companyId } });
            if (anyProduct) genericProduct = anyProduct;
            else {
                // Create a dummy product if table is empty (unlikely with seed)
                return NextResponse.json({ error: 'No hay productos configurados en el sistema' }, { status: 500 });
            }
        }

        // 3. Generate Number
        const count = await prisma.cotizacion.count({ where: { empresaId: companyId } });
        const quoteNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

        // 4. Transaction
        const newQuote = await prisma.$transaction(async (tx) => {
            return await tx.cotizacion.create({
                data: {
                    empresaId: companyId,
                    sucursalId: sucursal.id,
                    cajaId: caja.id,
                    clienteId: client.id,
                    creadorId: user.id,
                    numero: quoteNumber,
                    fechaEmision: new Date(),
                    validaHasta: new Date(validUntil || Date.now() + 86400000 * 15), // Default 15 days
                    subtotal: totals.subtotal,
                    totalDescuento: totals.discountTotal,
                    totalItbms: totals.taxTotal,
                    totalNeto: totals.total,
                    estado: 'borrador',
                    items: {
                        create: items.map((item: any) => ({
                            productoId: genericProduct!.id, // Force generic product for free-text items
                            descripcion: item.description, // Store the custom description
                            cantidad: item.quantity,
                            precioUnitario: item.price,
                            descuento: item.discount,
                            codigoTasaItbms: item.taxRate === "7" ? "01" : "00", // Map rate to code roughly
                            montoItbms: (item.price * item.quantity - (item.price * item.quantity * item.discount / 100)) * (Number(item.taxRate) / 100),
                            montoTotal: item.total
                        }))
                    }
                }
            });
        });

        return NextResponse.json({ data: newQuote });

    } catch (error) {
        console.error('Error saving quote:', error);
        return NextResponse.json(
            { error: 'Error guardando cotización' },
            { status: 500 }
        );
    }
}
