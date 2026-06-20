'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { useSidebarStore } from '@/lib/store';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopbarProps {
    title?: string;
    children?: React.ReactNode;
}

export function Topbar({ title, children }: TopbarProps) {
    const router = useRouter();
    const { toggleMobile } = useSidebarStore();
    const { user, signOut } = useAuth();

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleMobile}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
            </Button>

            {/* Title */}
            {title && (
                <h1 className="text-xl font-semibold text-foreground hidden sm:block">
                    {title}
                </h1>
            )}

            {/* Custom content (filters, etc) */}
            {children && <div className="flex-1">{children}</div>}

            {/* Spacer */}
            {!children && <div className="flex-1" />}

            {/* Search - Desktop */}
            <div className="hidden w-64 lg:block">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar..."
                        className="pl-8 bg-surface-light"
                    />
                </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                    3
                </span>
                <span className="sr-only">Notificaciones</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild id="user-menu-trigger">
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                            {user?.photoURL && (
                                <AvatarImage src={user.photoURL} alt={displayName} />
                            )}
                            <AvatarFallback className="bg-brand-1 text-white text-sm">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                            Perfil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            Configuración
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
