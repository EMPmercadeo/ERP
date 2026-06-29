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
    MessageSquare,
    BookOpen,
    UserCog,
    FileClock,
    CreditCard
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
    }, [user?.email]);

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

    const isSuperAdmin = role === 'super_admin';

    const mainItems = [
        { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Facturar', href: '/invoices/new', icon: FileText },
        { name: 'Productos', href: '/products', icon: Package },
        { name: 'Clientes', href: '/clients', icon: Users },
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

    return (
        <>
            {/* Bottom Nav Bar - Sticky to bottom on mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden font-sans">
                {mainItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-slate-500 transition-all",
                                isActive ? "text-brand-1 font-bold scale-105" : "hover:text-slate-700 active:scale-95"
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
                        "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-slate-500 transition-all",
                        isMenuOpen ? "text-brand-1 font-bold scale-105" : "hover:text-slate-700 active:scale-95"
                    )}
                >
                    <Menu className={cn("h-5 w-5", isMenuOpen ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                    <span className="text-[10px] mt-1 tracking-tight">Más</span>
                </button>
            </div>

            {/* Slide-up Backdrop Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 animate-in fade-in">
                    {/* Bottom Drawer Container */}
                    <div 
                        ref={menuRef}
                        className="fixed bottom-0 left-0 right-0 bg-slate-50 rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col font-sans transition-transform duration-300 translate-y-0 pb-10"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                                    {userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{userName}</h4>
                                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{user?.email}</p>
                                </div>
                                <Badge className={cn(
                                    "text-[9px] px-1.5 py-0 border-none font-bold uppercase shrink-0",
                                    userPlan === 'pro' && "bg-amber-500 text-white",
                                    userPlan === 'emprendedor' && "bg-indigo-500 text-white",
                                    userPlan === 'negocio' && "bg-cyan-600 text-white",
                                    userPlan === 'empresa' && "bg-slate-700 text-white",
                                    userPlan === 'free' && "bg-slate-200 text-slate-700"
                                )}>
                                    {planLabel}
                                </Badge>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 active:scale-90 transition-transform"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Menu Options Grid */}
                        <div className="p-4 space-y-4">
                            {/* App Sections */}
                            <div className="space-y-1">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Módulos</h5>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/pos" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all">
                                        <ShoppingCart className="h-4.5 w-4.5 text-brand-1" />
                                        <span>Venta POS</span>
                                    </Link>
                                    <Link href="/quotes" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all">
                                        <FileText className="h-4.5 w-4.5 text-brand-1" />
                                        <span>Cotizaciones</span>
                                    </Link>
                                    <Link href="/receivables" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all">
                                        <CreditCard className="h-4.5 w-4.5 text-brand-1" />
                                        <span>Por Cobrar</span>
                                    </Link>
                                    <Link href="/reports" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all">
                                        <BarChart3 className="h-4.5 w-4.5 text-brand-1" />
                                        <span>Reportes</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Settings & Support */}
                            <div className="space-y-1">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Cuenta y Soporte</h5>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/profile" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all">
                                        <User className="h-4.5 w-4.5 text-slate-500" />
                                        <span>Mi Cuenta</span>
                                    </Link>
                                    <Link href="/settings" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all">
                                        <Settings className="h-4.5 w-4.5 text-slate-500" />
                                        <span>Configuración</span>
                                    </Link>
                                    <Link href="/help" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all col-span-2">
                                        <HelpCircle className="h-4.5 w-4.5 text-slate-500" />
                                        <span>Centro de Ayuda y Guías</span>
                                    </Link>
                                    <Link href="/research-hub" className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-98 transition-all col-span-2">
                                        <BookOpen className="h-4.5 w-4.5 text-slate-500" />
                                        <span>Directorio Research Hub</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Super Admin Console (If Admin) */}
                            {isSuperAdmin && (
                                <div className="space-y-1">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Administración (Super Admin)</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href="/admin/empresas" className="flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700">
                                            <Users className="h-4 w-4 mr-1.5 text-indigo-500" />
                                            <span>Empresas</span>
                                        </Link>
                                        <Link href="/admin/users" className="flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700">
                                            <UserCog className="h-4 w-4 mr-1.5 text-indigo-500" />
                                            <span>Usuarios</span>
                                        </Link>
                                        <Link href="/admin/audit" className="flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700">
                                            <FileClock className="h-4 w-4 mr-1.5 text-indigo-500" />
                                            <span>Auditoría</span>
                                        </Link>
                                        <Link href="/admin/billing" className="flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700">
                                            <CreditCard className="h-4 w-4 mr-1.5 text-indigo-500" />
                                            <span>Facturación</span>
                                        </Link>
                                        <Link href="/admin/support" className="flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700 col-span-2">
                                            <MessageSquare className="h-4 w-4 mr-1.5 text-indigo-500" />
                                            <span>Tickets y Feedback General</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Logout */}
                            <Button
                                onClick={handleLogout}
                                className="w-full h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
