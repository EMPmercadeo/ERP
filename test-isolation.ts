
import { prismaApp } from './src/lib/db/app';
import { getTenantContext } from './src/lib/auth/context';

async function main() {
    console.log('Testing Multi-Tenancy Enforcement...');

    // 1. Mock Context (This depends on getTenantContext implementation returning a valid user)
    // In our implementation, it fetches the first user.
    try {
        const ctx = await getTenantContext();
        console.log('Context:', ctx);

        // 2. Query Invoices via App Wrapper
        const invoices = await prismaApp.factura.findMany({
            take: 5
        });

        console.log(`Found ${invoices.length} invoices for tenant ${ctx.empresaId}`);

        // 3. Verify all belong to tenant
        const invalid = invoices.filter(i => i.empresaId !== ctx.empresaId);
        if (invalid.length > 0) {
            console.error('❌ Data Leak Detected!', invalid);
            process.exit(1);
        } else {
            console.log('✅ Isolation Verified: All records match tenant.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
}

main();
