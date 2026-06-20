import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { InvoiceList } from '@/components/invoices/InvoiceList';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const invoices = await prisma.factura.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            cliente: true
        }
    });

    const formattedInvoices = invoices.map(i => ({
        id: i.id,
        numeroCompleto: i.numeroCompleto,
        clientName: i.cliente.razonSocial,
        clientRuc: i.cliente.ruc,
        fechaEmision: i.fechaEmision.toISOString(),
        totalNeto: i.totalNeto.toNumber(),
        saldoPendiente: i.saldoPendiente.toNumber(),
        estadoDgi: i.estadoDgi
    }));

    return (
        <>
            <Topbar title="Facturas" />
            <InvoiceList initialData={formattedInvoices} />
        </>
    );
}
