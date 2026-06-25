import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { getTenantContext } from '@/lib/auth/context';
import { getDocumentUsage } from '@/lib/actions/billing';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
    const { empresaId } = await getTenantContext();

    const [clients, products, documentUsage] = await Promise.all([
        prisma.cliente.findMany({
            where: { estado: 'activo' },
            select: { id: true, razonSocial: true, ruc: true }
        }),
        prisma.producto.findMany({
            where: { activo: true },
            select: { id: true, codigoInterno: true, descripcion: true, precioVenta: true, codigoTasaItbms: true }
        }),
        getDocumentUsage(empresaId)
    ]);

    const formattedClients = clients.map(c => ({
        id: c.id,
        razonSocial: c.razonSocial,
        ruc: c.ruc
    }));

    const formattedProducts = products.map(p => ({
        id: p.id,
        codigo: p.codigoInterno,
        descripcion: p.descripcion,
        precio: p.precioVenta.toNumber(),
        itbms: p.codigoTasaItbms
    }));

    return (
        <>
            <Topbar title="Nueva Factura" />
            <InvoiceForm 
                clients={formattedClients} 
                products={formattedProducts} 
                companyId={empresaId}
                remainingDocuments={documentUsage.remainingDocuments}
            />
        </>
    );
}
