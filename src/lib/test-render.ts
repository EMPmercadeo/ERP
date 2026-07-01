import { prisma } from './db';

async function test() {
    try {
        console.log('Fetching first user...');
        const user = await prisma.usuario.findFirst();
        if (!user) {
            console.log('No user found.');
            return;
        }
        console.log('Using user email:', user.email);

        console.log('Fetching first delivery note...');
        const note = await prisma.albaranVenta.findFirst();
        if (!note) {
            console.log('No note found.');
            return;
        }

        console.log(`Making request to http://localhost:3000/delivery-notes/${note.id}...`);
        const res = await fetch(`http://localhost:3000/delivery-notes/${note.id}`, {
            headers: {
                Cookie: `session_email=${user.email}`
            },
            redirect: 'manual'
        });

        console.log('Response status:', res.status);
        console.log('Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (res.status === 200) {
            const body = await res.text();
            console.log('Response body preview (first 1000 chars):');
            console.log(body.substring(0, 1000));
        } else {
            console.log('Non-200 response.');
        }
    } catch (e: any) {
        console.error('Error rendering:', e);
    }
}

test();
