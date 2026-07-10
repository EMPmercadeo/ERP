import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { timbrarFacturaDGI } from '@/lib/actions/billing-fe';

export const dynamic = 'force-dynamic';

// Este endpoint solía FABRICAR un CUFE falso y marcar cualquier factura como "aceptada" sin
// hablar nunca con un PAC real — lo que habría mostrado documentos fiscales falsos a clientes
// reales apenas se empezara a facturar en serio. Ahora delega en timbrarFacturaDGI(), la misma
// función que usa el resto de la app (UI, POS): habla con el proveedor PAC configurado en
// ConfiguracionFacturacionElectronica a través del adaptador en src/lib/facturacion-electronica,
// respeta el kill-switch PAC_INTEGRATION_ENABLED, y deja registro en FacturaPACLog. Mientras no
// haya un PAC real conectado, esta ruta responderá honestamente con un error en vez de simular
// éxito. La numeración (numeroSecuencial/numeroCompleto) ya se asigna al crear la factura en
// crearFacturaCompleta() — no se debe reasignar aquí.
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { empresaId } = await getTenantContext();
        const { id } = await props.params;

        const invoice = await prisma.factura.findFirst({ where: { id, empresaId } });
        if (!invoice) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }
        if (invoice.estadoDgi === 'aceptada') {
            return NextResponse.json({ error: 'Esta factura ya fue autorizada por la DGI.' }, { status: 400 });
        }

        const resultado = await timbrarFacturaDGI(id);

        if (!resultado.success) {
            return NextResponse.json({ error: resultado.message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            status: 'authorized',
            message: resultado.message,
            cufe: resultado.cufe
        });
    } catch (error) {
        console.error('API error in /authorize:', error);
        return NextResponse.json({ error: 'Error durante la autorización del PAC/DGI.' }, { status: 500 });
    }
}