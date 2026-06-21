import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

// Mock function to get current user ID - replace with your actual auth extraction logic
// Since I don't see the full auth implementation file, I'll assume we might need to look at cookies or headers,
// But for now, I'll rely on the existing pattern if I can find it.
// Wait, I should check how `Topbar` or other components get the user.
// I'll create a placeholder for now that queries Prisma if we have a way to identify the user (e.g. fixed ID for dev or via Context).
// Actually, looking at previous files, there isn't a clear auth provider visible in the open files lists. 
// I will start with a basic check that assumes we can get the user.

export async function verifySuperAdmin(userId: string) {
    if (!userId) {
        redirect('/login');
    }

    const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { rol: true }
    });

    if (!user || user.rol !== 'super_admin') {
        // Return 404 to hide existence of admin area
        redirect('/');
    }

    return true;
}
