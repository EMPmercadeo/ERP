'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, LogOut, AlertTriangle, AlertCircle, PackageX, Gauge, CheckCheck, PackageSearch } from 'lucide-react';

import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getNotificaciones, type Notificacion } from '@/lib/actions/notifications';
import { cn } from '@/lib/utils';
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

const ICONO_POR_TIPO: Record<Notificacion['tipo'], typeof AlertTriangle> = {
    facturas_vencidas: AlertTriangle,
    facturas_dgi_error: AlertCircle,
    stock_bajo: PackageX,
    plan_limite: Gauge,
    reabastecimiento: PackageSearch,
};

export function Topbar({ title, children }: TopbarProps) {
    const router = useRouter();

    const { user, signOut } = useAuth();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

    useEffect(() => {
        let activo = true;
        getNotificaciones()
            .then((data) => {
                if (activo) setNotificaciones(data);
            })
            .catch(() => {
                // Si falla la consulta (ej. sin sesión aún), simplemente no se muestran notificaciones.
            });
        return () => {
            activo = false;
        };
    }, []);

    const totalNotificaciones = notificaciones.reduce((sum, n) => sum + n.count, 0);

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
            {/* Logo on Mobile */}
            <div className="flex items-center gap-2 lg:hidden select-none">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-1">
                    <span className="text-xs font-bold text-white font-mono">EP</span>
                </div>
                <span className="text-sm font-bold text-foreground tracking-tight">
                    ERP Panamá
                </span>
            </div>

            {/* Title */}
            {title && (
                <h1 className="text-sm font-bold text-foreground uppercase tracking-wider hidden sm:block">
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {totalNotificaciones > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-medium text-white">
                                {totalNotificaciones > 9 ? '9+' : totalNotificaciones}
                            </span>
                        )}
                        <span className="sr-only">Notificaciones</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal text-xs uppercase tracking-wider text-muted-foreground">
                        Notificaciones
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notificaciones.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                            <CheckCheck className="h-5 w-5 text-success" />
                            <p className="text-xs text-muted-foreground">Todo al día, sin pendientes.</p>
                        </div>
                    ) : (
                        notificaciones.map((n) => {
                            const Icono = ICONO_POR_TIPO[n.tipo];
                            return (
                                <DropdownMenuItem key={n.id} asChild className="cursor-pointer whitespace-normal py-2.5">
                                    <Link href={n.href}>
                                        <Icono
                                            className={cn(
                                                'mt-0.5 h-4 w-4 shrink-0',
                                                n.severidad === 'critical' ? 'text-danger' : 'text-warning'
                                            )}
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium leading-tight">{n.titulo}</span>
                                            <span className="text-xs text-muted-foreground leading-tight">{n.mensaje}</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu — oculto en mobile: Perfil y Configuración ya están en el menú "Más"
                del BottomNavigation, así que mostrarlo también aquí arriba era redundante y
                quitaba espacio útil en una barra ya angosta. Se mantiene visible desde lg:
                hacia arriba, donde no existe bottom nav. Se envuelve en un div en vez de pasar
                "hidden" directo al Button, para no pelear con las clases de display que ya
                trae el componente Button internamente. */}
            <div className="hidden lg:block">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild id="user-menu-trigger">
                        <Button variant="ghost" aria-label="Abrir menú de usuario" className="relative h-9 w-9 rounded-full">
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
            </div>
        </header>
    );
}
