
import { prisma } from '../src/lib/db';

async function main() {
    console.log('Checking DB State...');
    const users = await prisma.usuario.findMany();
    const companies = await prisma.empresa.findMany();

    console.log(`Users: ${users.length}`);
    if (users.length > 0) console.log('First User:', users[0].email, users[0].rol);

    console.log(`Companies: ${companies.length}`);
    if (companies.length > 0) console.log('First Company:', companies[0].razonSocial, 'Plan:', companies[0].planType, 'Fiscal:', companies[0].fiscalEnabled);

    const proveedores = await prisma.proveedor.count();
    const compras = await prisma.compra.count();
    const pagos = await prisma.pagoProveedor.count();
    console.log(`Proveedores: ${proveedores} | Compras: ${compras} | Pagos: ${pagos}`);
}

main().catch(console.error);
