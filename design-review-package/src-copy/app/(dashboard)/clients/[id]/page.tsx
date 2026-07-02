import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ClientDetailClient } from './ClientDetailClient';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const initialTab = searchParams.tab || 'info';
    const { empresaId } = await getTenantContext();

    // 1. Fetch Client
    const client = await prisma.cliente.findFirst({
        where: { id, empresaId },
        include: {
            facturas: {
                orderBy: { fechaEmision: 'desc' },
            },
            pagos: {
                orderBy: { fechaPago: 'desc' }
            },
            albaranesVenta: {
                orderBy: { fechaEmision: 'desc' }
            }
        }
    });

    if (!client) {
        notFound();
    }

    // 2. Format client details
    const formattedClient = {
        id: client.id,
        tipoRuc: client.tipoRuc,
        ruc: client.ruc,
        dv: client.dv || '',
        razonSocial: client.razonSocial,
        nombreComercial: client.nombreComercial || '',
        direccion: client.direccion || '',
        email: client.email || '',
        telefono: client.telefono || '',
        limiteCredito: client.limiteCredito.toNumber(),
        saldoPendiente: client.facturas.reduce((sum, f) => sum + f.saldoPendiente.toNumber(), 0),
        saldoAFavor: client.saldoAFavor.toNumber(),
        condicionPago: client.condicionPago,
        estado: client.estado,
        createdAt: client.createdAt.toISOString()
    };

    // 3. Format invoices list
    const formattedInvoices = client.facturas.map(f => ({
        id: f.id,
        numeroCompleto: f.numeroCompleto,
        fechaEmision: f.fechaEmision.toISOString(),
        totalNeto: f.totalNeto.toNumber(),
        saldoPendiente: f.saldoPendiente.toNumber(),
        estadoDgi: f.estadoDgi,
        tipoDocumento: f.tipoDocumento
    }));

    // 4. Format payments list
    const formattedPayments = client.pagos.map(p => ({
        id: p.id,
        fechaPago: p.fechaPago.toISOString(),
        monto: p.monto.toNumber(),
        metodoPago: p.metodoPago,
        referencia: p.referencia || ''
    }));

    // 5. Format delivery notes list
    const formattedDeliveryNotes = client.albaranesVenta.map(a => ({
        id: a.id,
        numero: a.numero,
        fechaEmision: a.fechaEmision ? a.fechaEmision.toISOString() : new Date().toISOString(),
        totalNeto: a.totalNeto ? a.totalNeto.toNumber() : 0,
        estado: a.estado || 'pendiente'
    }));

    return (
        <ClientDetailClient 
            client={formattedClient} 
            invoices={formattedInvoices} 
            payments={formattedPayments}
            deliveryNotes={formattedDeliveryNotes}
            initialTab={initialTab}
        />
    );
}
