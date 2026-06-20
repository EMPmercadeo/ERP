
import { prisma } from '../src/lib/db';

async function main() {
    const targetEmail = 'empsignature@gmail.com';
    const targetName = 'Ernesto Morrison';

    console.log(`Configuring Super Admin for: ${targetEmail}`);

    // 1. Find or Create the target user
    let user = await prisma.usuario.findUnique({
        where: { email: targetEmail }
    });

    if (user) {
        // Update existing
        console.log('User exists. Updating role and name...');
        user = await prisma.usuario.update({
            where: { id: user.id },
            data: {
                rol: 'super_admin',
                nombre: targetName
            }
        });
    } else {
        // Create new
        console.log('User does not exist. Creating...');
        // Need an empresa to link to. Assuming the first one.
        const empresa = await prisma.empresa.findFirst();
        if (!empresa) throw new Error('No company found!');

        user = await prisma.usuario.create({
            data: {
                email: targetEmail,
                nombre: targetName,
                passwordHash: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // 'password'
                rol: 'super_admin',
                empresaId: empresa.id,
                activo: true
            }
        });
    }

    console.log(`✅ ${user.email} is now Super Admin.`);

    // 2. Delete other Super Admins
    console.log('Checking for old super admins...');
    const others = await prisma.usuario.findMany({
        where: {
            rol: 'super_admin',
            email: { not: targetEmail }
        }
    });

    for (const u of others) {
        console.log(`Deleting old admin: ${u.email}`);
        // We first need to reassign or delete their related records (Facturas, etc) to avoid FK errors 
        // if cascade isn't perfect, but let's try delete first or just demote if safer?
        // User asked to DELETE.
        // To safely delete, we might need to cascade. 
        // Let's try deleting. If it fails due to history, we'll demote to 'vendedor' and deactivate.
        try {
            await prisma.usuario.delete({ where: { id: u.id } });
            console.log('Deleted.');
        } catch (e) {
            console.log('Could not delete (likely has data). Deactivating and demoting instead.');
            await prisma.usuario.update({
                where: { id: u.id },
                data: {
                    rol: 'vendedor',
                    activo: false,
                    email: `deleted_${u.email}_${Date.now()}` // Rename to free up email if needed
                }
            });
        }
    }
}

main().catch(console.error);
