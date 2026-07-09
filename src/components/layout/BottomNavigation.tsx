'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    ShoppingCart,
    Users,
    Package,
    Menu,
    X,
    Settings,
    HelpCircle,
    User,
    BarChart3,
    LogOut,
    UserCog,
    FileClock,
    CreditCard,
    Building2,
    ClipboardList,
    Truck,
    ChevronRight,
    Shield,
    MessageSquare,
    Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/firebase/auth';
import { getCurrentUserWithPlan } from '@/lib/actions/auth';

export function BottomNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut, role } = useAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userPlan, setUserPlan] = useState('free');
    const [userName, setUserName] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when route changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMenuOpen(false);
    }, [pathname]);

    // Fetch user details
    useEffect(() => {
        if (user?.email) {
            getCurrentUserWithPlan(user.email).then(data => {
                if (data) {
                    setUserPlan(data.planType || 'free');
                    setUserName(data.nombre || user.displayName || 'Usuario');
                }
            });
        }
    }, [user?.email, user?.displayName]);

    // Close menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Ver nota en Sidebar.tsx: solo controla visibilidad del enlace, la autorización
    // real vive en admin/layout.tsx vía getTenantContext(). No aflojar con fallbacks.
    const isSuperAdmin = role === 'super_admin';

    const mainItems = [
        { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Facturas', href: '/invoices', icon: FileText },
        { name: 'POS', href: '/pos', icon: ShoppingCart },
        { name: 'Clientes', href: '/clients', icon: Users },
    ];

    // Menú "Más": una sola lista vertical dividida en secciones (en vez de una
    // grilla de íconos), para aprovechar mejor el ancho y que quepa todo sin
    // recortarse — el contenedor sí hace scroll si el contenido es más alto
    // que la pantalla.
    const moreSections: { titulo: string; items: { name: string; href: string; icon: typeof Package }[] }[] = [
        {
            titulo: 'Módulos Principales',
            items: [
                { name: 'Productos', href: '/products', icon: Package },
                { name: 'Cotizaciones', href: '/quotes', icon: FileText },
                { name: 'Pedidos', href: '/orders', icon: ClipboardList },
                { name: 'Notas de Entrega', href: '/delivery-notes', icon: Truck },
                { name: 'Colaboradores (RRHH)', href: '/rrhh/empleados', icon: Users },
                { name: 'Ausencias y Permisos', href: '/rrhh/ausencias', icon: ClipboardList },
                { name: 'Proveedores', href: '/suppliers', icon: Building2 },
                { name: 'Compras', href: '/purchases', icon: Package },
                { name: 'Cuentas por Cobrar', href: '/receivables', icon: CreditCard },
                { name: 'Reportes', href: '/reports', icon: BarChart3 },
            ],
        },
        {
            titulo: 'Cuenta y Ayuda',
            items: [
                { name: 'Mi Cuenta', href: '/profile', icon: User },
                { name: 'Ajustes', href: '/settings', icon: Settings },
                { name: 'Ayuda 24/7', href: '/help', icon: HelpCircle },
            ],
        },
    ];

    const adminItems = [
        { name: 'Panel de Administración', href: '/admin', icon: LayoutDashboard },
        { name: 'Empresas y Cuentas', href: '/admin/empresas', icon: Users },
        { name: 'Usuarios', href: '/admin/users', icon: UserCog },
        { name: 'Planes y Pagos', href: '/admin/billing', icon: CreditCard },
        { name: 'Soporte y Tickets', href: '/admin/support', icon: MessageSquare },
        { name: 'Correos y Plantillas', href: '/admin/correos', icon: Send },
        { name: 'PAC (Facturación DGI)', href: '/admin/pac', icon: Building2 },
        { name: 'Auditoría', href: '/admin/audit', icon: FileClock },
        { name: 'Configuración Global', href: '/admin/configuracion', icon: Settings },
    ];

    const getPlanLabel = (plan: string) => {
        switch (plan) {
            case 'pro': return 'Pro';
            case 'emprendedor': return 'Emprendedor';
            case 'negocio': return 'Negocio';
            case 'empresa': return 'Empresa';
            case 'free':
            default:
                return 'Free';
        }
    };

    const planLabel = getPlanLabel(userPlan);

    const MenuRow = ({ name, href, icon: Icon }: { name: string; href: string; icon: typeof Package }) => (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-white active:bg-accent transition-colors"
        >
            <Icon className="h-4.5 w-4.5 text-brand-1 shrink-0" />
            <span className="flex-1">{name}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
    );

    return (
        <>
            {/* Bottom Nav Bar - Sticky to bottom on mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden font-sans">
                {mainItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-muted-foreground transition-all",
                                isActive ? "text-brand-1 font-bold scale-105" : "hover:text-foreground active:scale-95"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                            <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}

                {/* More trigger button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={cn(
                        "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-muted-foreground transition-all",
                        isMenuOpen ? "text-brand-1 font-bold scale-105" : "hover:text-foreground active:scale-95"
                    )}
                >
                    <Menu className={cn("h-5 w-5", isMenuOpen ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                    <span className="text-[10px] mt-1 tracking-tight">Más</span>
                </button>
            </div>

            {/* Full-screen Slide-up Mobile Menu — lista vertical, con scroll propio */}
            {isMenuOpen && (
                <div
                    ref={menuRef}
                    className="fixed inset-0 z-50 bg-muted flex flex-col font-sans lg:hidden animate-in slide-in-from-bottom duration-300"
                >
                    {/* Header */}
                    <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-brand-1 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                                {userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground truncate max-w-[160px]">{userName}</h4>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{user?.email}</p>
                            </div>
                            <Badge className={cn(
                                "text-[8px] px-1.5 py-0 border-none font-bold uppercase shrink-0",
                                userPlan === 'pro' && "bg-amber-500 text-white",
                                userPlan === 'emprendedor' && "bg-indigo-500 text-white",
                                userPlan === 'negocio' && "bg-cyan-600 text-white",
                                userPlan === 'empresa' && "bg-secondary text-white",
                                userPlan === 'free' && "bg-muted text-foreground"
                            )}>
                                {planLabel}
                            </Badge>
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-accent active:scale-90 transition-transform shrink-0"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Lista vertical, con scroll si no cabe todo */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 pb-safe">
                        {moreSections.map((section) => (
                            <div key={section.titulo}>
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                                    {section.titulo}
                                </h5>
                                <div className="bg-muted/60 rounded-xl overflow-hidden divide-y divide-white">
                                    {section.items.map((item) => (
                                        <MenuRow key={item.name} {...item} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {isSuperAdmin && (
                            <div>
                                <h5 className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider px-3 mb-1">
                                    <Shield className="h-3 w-3" />
                                    Super Admin
                                </h5>
                                <div className="bg-amber-50 rounded-xl overflow-hidden divide-y divide-white border border-amber-100">
                                    {adminItems.map((item) => (
                                        <MenuRow key={item.name} {...item} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleLogout}
                            className="w-full h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
                        >
                            <LogOut className="h-4.5 w-4.5" />
                            <span>Cerrar Sesión</span>
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
