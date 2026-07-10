import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { timbrarFacturaDGI } from '@/lib/actions/billing-fe';

export const dynamic = 'force-dynamic';

// Antes este endpoint decidía con Math.random() si cada factura "pendiente" quedaba
// aceptada o rechazada por la DGI, y le escribía un CUFE fabricado (hash, no un CUFE real)
// directamente en Factura.cufe — corrompiendo documentos fiscales reales cada vez que se
// llamaba, sin ningún kill-switch. Ahora reutiliza timbrarFacturaDGI (src/lib/actions/billing-fe.ts),
// el mismo camino que ya usa el resto de la app y que respeta PAC_INTEGRATION_ENABLED: mientras
// no haya un PAC real contratado, no se le pone nada falso a ninguna factura.
export async function POST(_request: NextRequest) {
    try {
        const { empresaId } = await getTenantContext();

        const pendingInvoices = await prisma.factura.findMany({
            where: {
                empresaId,
                estadoDgi: 'pendiente'
            },
            select: { id: true }
        });

        let aceptadas = 0;
        let rechazadas = 0;
        let sinCambio = 0;

        for (const invoice of pendingInvoices) {
            const resultado = await timbrarFacturaDGI(invoice.id);
            if (resultado.success) {
                aceptadas++;
            } else if (resultado.message?.includes('no está habilitada')) {
                // PAC_INTEGRATION_ENABLED apagado: no hay PAC real todavía, no se tocó la factura.
                sinCambio++;
            } else {
                rechazadas++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Trabajo de reconciliación completado. Facturas procesadas: ${pendingInvoices.length}, Aceptadas: ${aceptadas}, Rechazadas: ${rechazadas}, Sin cambio (PAC no disponible): ${sinCambio}`
        });
    } catch (error) {
        console.error('API error in /reconciliation/jobs:', error);
        return NextResponse.json({ error: 'Error procesando el job de reconciliación.' }, { status: 500 });
    }
}
