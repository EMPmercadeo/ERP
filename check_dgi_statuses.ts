
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const statuses = await prisma.factura.groupBy({
        by: ['estadoDgi'],
        _count: {
            estadoDgi: true
        }
    });

    console.log('Distinct DGI Statuses:', statuses);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
