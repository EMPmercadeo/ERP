import { prisma } from './db';

async function check() {
    try {
        console.log('--- Database Sanity Check ---');
        const notes = await prisma.albaranVenta.findMany({
            include: {
                cliente: true,
                creador: true
            }
        });
        console.log(`Total AlbaranVenta records: ${notes.length}`);

        for (const note of notes) {
            if (!note.cliente) {
                console.error(`🚨 Note ID ${note.id} has no associated cliente (clienteId: ${note.clienteId})`);
            }
            if (!note.creador) {
                console.error(`🚨 Note ID ${note.id} has no associated creador (creadorId: ${note.creadorId})`);
            }
            if (!note.fechaEmision) {
                console.error(`🚨 Note ID ${note.id} has no fechaEmision`);
            }
            if (note.totalNeto === undefined || note.totalNeto === null) {
                console.error(`🚨 Note ID ${note.id} has null totalNeto`);
            }
        }
        console.log('--- Check Completed ---');
    } catch (e: any) {
        console.error('Error in check:', e);
    }
}

check();
