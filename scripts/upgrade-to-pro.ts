
import { prisma } from '../src/lib/db';

async function main() {
    console.log('Upgrading Company to PRO...');
    const company = await prisma.empresa.findFirst();
    if (company) {
        await prisma.empresa.update({
            where: { id: company.id },
            data: {
                planType: 'pro',
                fiscalEnabled: true
            }
        });
        console.log(`✅ Company ${company.razonSocial} upgraded to PRO.`);
    } else {
        console.log('❌ No company found to upgrade.');
    }
}

main().catch(console.error);
