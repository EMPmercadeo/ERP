import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    // Fetch all invoices
    const invoices = await prisma.factura.findMany({
        include: {
            cliente: {
                select: {
                    razonSocial: true,
                    ruc: true
                }
            },
            items: true
        }
    });

    let totalSales = 0;
    let totalItbms = 0;
    let unpaidBalance = 0;
    const invoiceCount = invoices.length;

    const clientMap: { [key: string]: { name: string; ruc: string; total: number; count: number } } = {};
    const productMap: { [key: string]: { desc: string; qty: number; total: number } } = {};

    invoices.forEach(inv => {
        const net = Number(inv.totalNeto || 0);
        const itbms = Number(inv.totalItbms || 0);
        const bal = Number(inv.saldoPendiente || 0);

        totalSales += net;
        totalItbms += itbms;
        unpaidBalance += bal;

        // Group by Client
        const cId = inv.clienteId;
        const clientName = inv.cliente?.razonSocial || 'Cliente General';
        const clientRuc = inv.cliente?.ruc || '123456';
        if (!clientMap[cId]) {
            clientMap[cId] = {
                name: clientName,
                ruc: clientRuc,
                total: 0,
                count: 0
            };
        }
        clientMap[cId].total += net;
        clientMap[cId].count += 1;

        // Group by Product (items)
        inv.items.forEach(item => {
            const pId = item.productoId;
            const qty = Number(item.cantidad || 0);
            const total = Number(item.montoTotal || 0);

            if (!productMap[pId]) {
                productMap[pId] = {
                    desc: item.descripcion || 'Producto',
                    qty: 0,
                    total: 0
                };
            }
            productMap[pId].qty += qty;
            productMap[pId].total += total;
        });
    });

    // Sort to get Top 5
    const topClients = Object.values(clientMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    const topProducts = Object.values(productMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    const allClientReport = Object.values(clientMap)
        .sort((a, b) => b.total - a.total);

    return (
        <>
            <Topbar title="Reportes" />
            <ContentContainer>
                <ReportsDashboard
                    totalSales={totalSales}
                    totalItbms={totalItbms}
                    unpaidBalance={unpaidBalance}
                    invoiceCount={invoiceCount}
                    topClients={topClients}
                    topProducts={topProducts}
                    allClientReport={allClientReport}
                />
            </ContentContainer>
        </>
    );
}
