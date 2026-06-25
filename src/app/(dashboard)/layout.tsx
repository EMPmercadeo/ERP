'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Content } from "@/components/layout/Content";
import { BottomNavigation } from "@/components/layout/BottomNavigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Sidebar />
            <Content>
                {children}
            </Content>
            <BottomNavigation />
        </>
    );
}

