
import { prisma } from '../src/lib/db';

async function main() {
    const superAdmin = await prisma.usuario.findFirst({
        where: { rol: 'super_admin' }
    });

    if (superAdmin) {
        console.log('User found:', superAdmin.email);
        console.log('Role:', superAdmin.rol);
    } else {
        console.log('No super admin found.');
    }
}

main().catch(console.error);
