'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Users,
    Package,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    HelpCircle,
    LogOut,
    X,
    Shield,
    UserCog,
    FileClock,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Facturas', href: '/invoices', icon: FileText },
    { name: 'Cotizaciones', href: '/quotes', icon: FileText },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
];

const adminNavigation = [
    { name: 'Empresas', href: '/admin/empresas', icon: Users },
    { name: 'Usuarios', href: '/admin/users', icon: UserCog },
    { name: 'Auditoría', href: '/admin/audit', icon: FileClock },
    { name: 'Facturación', href: '/admin/billing', icon: CreditCard },
];

const footerNavigation = [
    { name: 'Configuración', href: '/settings', icon: Settings },
    { name: 'Ayuda', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isCollapsed: storedCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen } = useSidebarStore();
    const { user, signOut, role } = useAuth(); // Role from cached AuthContext
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isCollapsed = isMounted ? storedCollapsed : false;
    const isSuperAdmin = role === 'super_admin';

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const NavItem = ({ item, isFooter = false }: { item: any, isFooter?: boolean }) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        const linkContent = (
            <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
            >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
            </Link>
        );

        if (isCollapsed) {
            return (
                <li key={item.name}>
                    <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="bg-sidebar text-sidebar-foreground">
                            {item.name}
                        </TooltipContent>
                    </Tooltip>
                </li>
            );
        }

        return <li key={item.name}>{linkContent}</li>;
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
                    isCollapsed ? 'w-16' : 'w-64',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 shrink-0">
                    {!isCollapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-1">
                                <span className="text-sm font-bold text-white">EP</span>
                            </div>
                            <span className="text-lg font-semibold text-sidebar-foreground">
                                ERP Panamá
                            </span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-brand-1">
                            <span className="text-sm font-bold text-white">EP</span>
                        </div>
                    )}
                    {/* Mobile close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                    <TooltipProvider delayDuration={0}>
                        <ul className="space-y-1">
                            {isSuperAdmin && (
                                <>
                                    <div className={cn("mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider", isCollapsed && "hidden")}>
                                        Admin Console
                                    </div>
                                    {adminNavigation.map((item) => (
                                        <NavItem key={item.name} item={item} />
                                    ))}
                                    <div className="my-2 border-t border-sidebar-border" />
                                    <div className={cn("mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider", isCollapsed && "hidden")}>
                                        App
                                    </div>
                                </>
                            )}

                            {mainNavigation.map((item) => (
                                <NavItem key={item.name} item={item} />
                            ))}
                        </ul>
                    </TooltipProvider>
                </nav>

                {/* Footer Navigation (Settings, Help, Logout) */}
                <div className="border-t border-sidebar-border p-3 space-y-1 bg-sidebar">
                    <TooltipProvider delayDuration={0}>
                        <ul className="space-y-1">
                            {footerNavigation.map((item) => (
                                <NavItem key={item.name} item={item} isFooter />
                            ))}

                            {/* Logout Button */}
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className={cn(
                                        'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive group'
                                    )}
                                >
                                    <LogOut className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span>Cerrar Sesión</span>}
                                </button>
                            </li>
                        </ul>
                    </TooltipProvider>

                    {/* Collapse toggle - Desktop only */}
                    <div className="hidden pt-2 lg:block">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            onClick={toggleCollapsed}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    <span>Colapsar</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}
