
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Inserting rejected and error invoices...');

    // Need minimal relations
    const empresa = await prisma.empresa.findFirst();
    const sucursal = await prisma.sucursal.findFirst();
    const caja = await prisma.caja.findFirst();
    const cliente = await prisma.cliente.findFirst();
    const usuario = await prisma.usuario.findFirst();

    if (!empresa || !sucursal || !caja || !cliente || !usuario) {
        console.error('Missing base data (Empresa, Sucursal, etc). Seed DB first.');
        return;
    }

    // Create 5 Rejected
    for (let i = 0; i < 5; i++) {
        await prisma.factura.create({
            data: {
                empresaId: empresa.id,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: cliente.id,
                creadorId: usuario.id,
                tipoDocumento: 'FE',
                numeroSecuencial: 9000 + i,
                numeroCompleto: `TEST-REJ-${i}`,
                subtotal: 100,
                totalItbms: 7,
                totalNeto: 107,
                saldoPendiente: 107,
                estadoDgi: 'rechazada',
                errorDgi: 'Error de validación de esquema XSD',
                fechaEmision: new Date(),
            }
        });
    }

    // Create 3 Error
    for (let i = 0; i < 3; i++) {
        await prisma.factura.create({
            data: {
                empresaId: empresa.id,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: cliente.id,
                creadorId: usuario.id,
                tipoDocumento: 'FE',
                numeroSecuencial: 9100 + i,
                numeroCompleto: `TEST-ERR-${i}`,
                subtotal: 200,
                totalItbms: 14,
                totalNeto: 214,
                saldoPendiente: 214,
                estadoDgi: 'error',
                errorDgi: 'Timeout de conexión con DGI',
                fechaEmision: new Date(),
            }
        });
    }

    // Create 2 Anulada
    for (let i = 0; i < 2; i++) {
        await prisma.factura.create({
            data: {
                empresaId: empresa.id,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: cliente.id,
                creadorId: usuario.id,
                tipoDocumento: 'FE',
                numeroSecuencial: 9200 + i,
                numeroCompleto: `TEST-ANUL-${i}`,
                subtotal: 50,
                totalItbms: 0,
                totalNeto: 50,
                saldoPendiente: 50,
                estadoDgi: 'anulada',
                fechaEmision: new Date(),
            }
        });
    }

    console.log('✅ Successfully inserted: 5 Cancelled, 3 Error, 2 Anulada');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
