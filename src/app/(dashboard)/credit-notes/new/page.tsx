import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { CreditNoteForm } from '@/components/credit-notes/CreditNoteForm';
import { getTenantContext } from '@/lib/auth/context';
import { getInvoicesForCreditNote } from '@/lib/actions/credit-notes';

export const dynamic = 'force-dynamic';

export default async function NewCreditNotePage() {
    const { empresaId } = await getTenantContext();

    const [invoices, clients, products] = await Promise.all([
        getInvoicesForCreditNote(),
        prisma.cliente.findMany({
            where: { empresaId, estado: 'activo' },
            select: { id: true, razonSocial: true, ruc: true }
        }),
        prisma.producto.findMany({
            where: { empresaId, activo: true },
            select: { id: true, codigoInterno: true, descripcion: true, precioVenta: true, codigoTasaItbms: true }
        })
    ]);

    const formattedClients = clients.map((c) => ({
        id: c.id,
        razonSocial: c.razonSocial,
        ruc: c.ruc
    }));

    const formattedProducts = products.map((p) => ({
        id: p.id,
        codigo: p.codigoInterno,
        descripcion: p.descripcion,
        precio: p.precioVenta.toNumber(),
        itbms: p.codigoTasaItbms
    }));

    return (
        <>
            <Topbar title="Nueva Nota de Crédito Fiscal" />
            <ContentContainer>
                <CreditNoteForm
                    invoices={invoices}
                    clients={formattedClients}
                    products={formattedProducts}
                />
            </ContentContainer>
        </>
    );
}
