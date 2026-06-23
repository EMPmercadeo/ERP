import { prisma } from '../src/lib/db';

async function main() {
    console.log('Fetching products from DB...');
    try {
        const products = await prisma.producto.findMany({
            include: {
                _count: {
                    select: { items: true, cotizacionItems: true }
                }
            }
        });
        console.log(`Found ${products.length} products.`);
        for (const p of products) {
            try {
                const cost = p.costoUnitario.toNumber();
                const price = p.precioVenta.toNumber();
                console.log(`Product: ID=${p.id}, Code=${p.codigoInterno}, Desc=${p.descripcion.substring(0, 20)}, Cost=${cost}, Price=${price}, Active=${p.activo}`);
            } catch (err: any) {
                console.error(`!!! CRASH on Product ID=${p.id}:`, err.message);
            }
        }

        console.log('Fetching audit logs from DB...');
        const logs = await prisma.auditoria.findMany({
            take: 10,
            include: { usuario: { select: { nombre: true, email: true } } }
        });
        console.log(`Fetched ${logs.length} audit logs.`);
        for (const log of logs) {
            console.log(`Log ID=${log.id}, User=${log.usuario?.nombre || 'NULL'}, Email=${log.usuario?.email || 'NULL'}`);
        }

        console.log('Fetching invoice items from DB...');
        const invoiceItems = await prisma.facturaItem.findMany({
            take: 10,
            include: { factura: { select: { numeroCompleto: true, fechaEmision: true, cliente: { select: { razonSocial: true } } } } }
        });
        console.log(`Fetched ${invoiceItems.length} invoice items.`);
        for (const item of invoiceItems) {
            console.log(`Item ID=${item.id}, Factura=${item.factura?.numeroCompleto || 'NULL'}, Cliente=${item.factura?.cliente?.razonSocial || 'NULL'}`);
        }
    } catch (e: any) {
        console.error('Error querying DB:', e);
    }
}

main().catch(console.error);
