import { prisma } from './db';

async function test() {
    try {
        console.log('Fetching first company...');
        const empresa = await prisma.empresa.findFirst();
        if (!empresa) {
            console.log('No company found.');
            return;
        }
        console.log('Using empresaId:', empresa.id);

        console.log('Fetching notes...');
        const notes = await prisma.albaranVenta.findMany({
            where: { empresaId: empresa.id },
            include: {
                cliente: {
                    select: {
                        razonSocial: true,
                        ruc: true,
                    }
                }
            },
            orderBy: { fechaEmision: 'desc' }
        });

        console.log('Found notes:', notes.length);

        console.log('Formatting notes...');
        const formattedNotes = notes.map(n => ({
            id: n.id,
            numero: n.numero,
            fechaEmision: n.fechaEmision.toISOString().split('T')[0],
            totalNeto: Number(n.totalNeto),
            estado: n.estado,
            observaciones: n.observaciones,
            clienteId: n.clienteId,
            cliente: {
                razonSocial: n.cliente.razonSocial,
                ruc: n.cliente.ruc
            }
        }));

        console.log('Formatting success! Sample note:', formattedNotes[0]);
    } catch (e: any) {
        console.error('Error in test:', e);
    }
}

test();
