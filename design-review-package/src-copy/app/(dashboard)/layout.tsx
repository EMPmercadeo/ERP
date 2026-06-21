'use client';

import { AuthProvider } from '@/lib/firebase/auth';
import { Sidebar } from "@/components/layout/Sidebar";
import { Content } from "@/components/layout/Content";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <Sidebar />
            <Content>
                {children}
            </Content>
        </AuthProvider>
    );
}
