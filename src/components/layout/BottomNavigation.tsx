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
    CreditCard,
    Building2,
    ClipboardList,
    Truck
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

            {/* Full-screen Slide-up Mobile Menu */}
            {isMenuOpen && (
                <div 
                    ref={menuRef}
                    className="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans lg:hidden animate-in slide-in-from-bottom duration-300 pb-6 overflow-hidden"
                >
                    {/* Header Compacto */}
                    <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8.5 w-8.5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                                {userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{userName}</h4>
                                <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{user?.email}</p>
                            </div>
                            <Badge className={cn(
                                "text-[8px] px-1.5 py-0 border-none font-bold uppercase shrink-0",
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
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 active:scale-90 transition-transform shrink-0"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Menu Options Grid (No Scroll, spaced nicely) */}
                    <div className="p-4 flex-1 flex flex-col justify-around overflow-hidden">
                        {/* App Sections */}
                        <div className="space-y-1.5">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Módulos Principales</h5>
                            <div className="grid grid-cols-3 gap-2">
                                <Link href="/pos" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <ShoppingCart className="h-4.5 w-4.5 text-brand-1" />
                                    <span>POS</span>
                                </Link>
                                <Link href="/quotes" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <FileText className="h-4.5 w-4.5 text-brand-1" />
                                    <span>Cotizar</span>
                                </Link>
                                <Link href="/orders" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <ClipboardList className="h-4.5 w-4.5 text-brand-1" />
                                    <span>Pedidos</span>
                                </Link>
                                <Link href="/delivery-notes" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <Truck className="h-4.5 w-4.5 text-brand-1" />
                                    <span>Entregas</span>
                                </Link>
                                <Link href="/suppliers" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <Building2 className="h-4.5 w-4.5 text-brand-1" />
                                    <span>Proveedores</span>
                                </Link>
                                <Link href="/purchases" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <Package className="h-4.5 w-4.5 text-brand-1" />
                                    <span>Compras</span>
                                </Link>
                                <Link href="/receivables" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <CreditCard className="h-4.5 w-4.5 text-brand-1" />
                                    <span>Cobros</span>
                                </Link>
                                <Link href="/reports" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <BarChart3 className="h-4.5 w-4.5 text-brand-1" />
                                    <span>Reportes</span>
                                </Link>
                            </div>
                        </div>

                        {/* Settings & Support */}
                        <div className="space-y-1.5">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Cuenta y Ayuda</h5>
                            <div className="grid grid-cols-3 gap-2">
                                <Link href="/profile" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <User className="h-4.5 w-4.5 text-slate-500" />
                                    <span>Mi Cuenta</span>
                                </Link>
                                <Link href="/settings" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <Settings className="h-4.5 w-4.5 text-slate-500" />
                                    <span>Ajustes</span>
                                </Link>
                                <Link href="/help" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 text-[11px] font-semibold text-slate-700 active:scale-95 transition-all text-center shadow-2xs">
                                    <HelpCircle className="h-4.5 w-4.5 text-slate-500" />
                                    <span>Ayuda 24/7</span>
                                </Link>
                            </div>
                        </div>

                        {/* Super Admin Console (If Admin) */}
                        {isSuperAdmin && (
                            <div className="space-y-1.5">
                                <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Super Admin</h5>
                                <div className="grid grid-cols-3 gap-2">
                                    <Link href="/admin/empresas" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl text-[10px] font-semibold text-slate-700 text-center shadow-2xs">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        <span>Empresas</span>
                                    </Link>
                                    <Link href="/admin/users" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl text-[10px] font-semibold text-slate-700 text-center shadow-2xs">
                                        <UserCog className="h-4 w-4 text-indigo-500" />
                                        <span>Usuarios</span>
                                    </Link>
                                    <Link href="/admin/audit" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl text-[10px] font-semibold text-slate-700 text-center shadow-2xs">
                                        <FileClock className="h-4 w-4 text-indigo-500" />
                                        <span>Auditoría</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout Compacto */}
                    <div className="px-4 pt-2 shrink-0">
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
