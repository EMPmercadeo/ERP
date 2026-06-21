import { Sidebar } from '@/components/layout/Sidebar';
import { Content } from '@/components/layout/Content';
import { verifySuperAdmin } from '@/lib/auth/admin';
import { getTenantContext } from '@/lib/auth/context';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Get current tenant context (redirects to /login if unauthenticated)
    const context = await getTenantContext();

    // 2. Enforce super admin check (redirects to / if unauthorized)
    await verifySuperAdmin(context.userId);

    // Using standardized layout components for consistency
    return (
        <>
            <Sidebar />
            <Content>
                {children}
            </Content>
        </>
    );
}
