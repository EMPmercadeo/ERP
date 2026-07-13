'use client';

import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stopImpersonation } from '@/lib/actions/impersonate';

import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store';

export function ImpersonationBanner({
    isImpersonating,
    tenantName
}: {
    isImpersonating: boolean;
    tenantName?: string;
}) {
    const { isCollapsed } = useSidebarStore();

    if (!isImpersonating) return null;

    return (
        <div className={cn(
            "bg-warning-bg border-b border-warning/30 text-warning px-4 py-2 flex items-center justify-between sticky top-0 z-40 transition-all duration-300",
            isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}>
            <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-warning" />
                <span className="font-medium text-sm">
                    Modo Supervisión: Estás actuando como <strong>{tenantName || 'Empresa Impersonada'}</strong>
                </span>
            </div>
            <form action={stopImpersonation}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-warning-bg/70 text-warning h-8"
                    type="submit"
                >
                    Salir de este modo
                    <X className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
