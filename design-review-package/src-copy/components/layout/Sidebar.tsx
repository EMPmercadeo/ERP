'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
    UserCog,
    FileClock,
    CreditCard,
    User as UserIcon,
    Gift,
    MessageSquare,
    Globe,
    Shield,
    ArrowLeft,
    Check,
    ExternalLink,
    Send,
    Copy,
    Building2,
    ShoppingCart,
    ClipboardList,
    Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/firebase/auth';
import { getCurrentUserWithPlan } from '@/lib/actions/auth';
import { createSupportTicket, submitFeedback } from '@/lib/actions/support';
import { toast } from 'sonner';

const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Cotizaciones', href: '/quotes', icon: FileText },
    { name: 'Pedidos', href: '/orders', icon: ClipboardList },
    { name: 'Notas de Entrega', href: '/delivery-notes', icon: Truck },
    { name: 'Facturas', href: '/invoices', icon: FileText },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Proveedores', href: '/suppliers', icon: Building2 },
    { name: 'Compras', href: '/purchases', icon: ShoppingCart },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
];

const adminNavigation = [
    { name: 'Empresas', href: '/admin/empresas', icon: Users },
    { name: 'Usuarios', href: '/admin/users', icon: UserCog },
    { name: 'Auditoría', href: '/admin/audit', icon: FileClock },
    { name: 'Facturación', href: '/admin/billing', icon: CreditCard },
    { name: 'Soporte y Feedback', href: '/admin/support', icon: MessageSquare },
];

// Configuración and Ayuda are now rendered within the user profile popover

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isCollapsed: storedCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen } = useSidebarStore();
    const { user, signOut, role } = useAuth();
    const [isMounted, setIsMounted] = useState(false);

    // Profile menu states
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [submenu, setSubmenu] = useState<'main' | 'languages' | 'terms'>('main');
    const [language, setLanguage] = useState<'es' | 'en'>('es');
    const [userPlan, setUserPlan] = useState<string>('free');
    const [userName, setUserName] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Modal states
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    
    // Modal input states
    const [feedbackText, setFeedbackText] = useState('');
    const [supportSubject, setSupportSubject] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch user details including planType
    useEffect(() => {
        if (user?.email) {
            getCurrentUserWithPlan(user.email).then(data => {
                if (data) {
                    setUserPlan(data.planType || 'free');
                    setUserName(data.nombre || user.displayName || 'Usuario');
                }
            });
        }
    }, [user]);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setSubmenu('main');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const copyReferralCode = () => {
        navigator.clipboard.writeText('ERPPANAMA50');
        toast.success('¡Código de referido copiado al portapapeles!');
    };

const handleSendFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;
        setIsSubmittingFeedback(true);
        try {
            const res = await submitFeedback(feedbackText);
            if (res.success) {
                toast.success(res.message);
                setFeedbackText('');
                setShowFeedbackModal(false);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Error al enviar comentarios.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleSendSupport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supportSubject.trim() || !supportMessage.trim()) return;
        setIsSubmittingSupport(true);
        try {
            const res = await createSupportTicket(supportSubject, supportMessage);
            if (res.success) {
                toast.success(res.message);
                setSupportSubject('');
                setSupportMessage('');
                setShowSupportModal(false);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Error al enviar el ticket de soporte.');
        } finally {
            setIsSubmittingSupport(false);
        }
    };

    const NavItem = ({ item }: { item: any }) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        const linkContent = (
            <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden',
                    isActive
                        ? 'bg-white/10 text-white font-semibold shadow-inner'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                )}
            >
                {isActive && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-400 rounded-r" />
                )}
                <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", isActive ? "scale-105 text-blue-400" : "text-white/60")} />
                {!isCollapsed && <span className="ml-1">{item.name}</span>}
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

    const initials = userName
        ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    const getPlanLabel = (plan: string) => {
        switch (plan) {
            case 'pro': return 'Pro';
            case 'basic': return 'Básico';
            case 'enterprise': return 'Enterprise';
            case 'free':
            default:
                return 'Free';
        }
    };

    const planLabel = getPlanLabel(userPlan);

    return (
        <>
            {/* Sidebar - Desktop Only */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 hidden lg:flex h-full flex-col border-r border-sidebar-border/30 bg-sidebar transition-all duration-300',
                    isCollapsed ? 'w-16' : 'w-64'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border/20 px-4 shrink-0">
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

                {/* User Profile Popover & Collapse Toggle */}
                <div className="border-t border-sidebar-border/20 p-3 space-y-2 bg-sidebar relative font-sans">

                    {/* Collapse toggle - Desktop only */}
                    <div className="hidden lg:block">
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

                    <div className="border-t border-sidebar-border/20 my-2" />

                    {/* User Card with Dropdown Trigger */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-sidebar-accent text-left focus:outline-none",
                                isDropdownOpen && "bg-sidebar-accent"
                            )}
                        >
                            {/* Avatar */}
                            <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-sm shadow-inner shrink-0">
                                {initials}
                            </div>
                            
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-sidebar-foreground truncate max-w-[110px]">
                                            {userName || user?.email?.split('@')[0]}
                                        </p>
                                        <Badge className={cn(
                                            "text-[9px] px-1.5 py-0 border-none font-bold uppercase",
                                            userPlan === 'pro' && "bg-amber-500 hover:bg-amber-500 text-white shadow-sm",
                                            userPlan === 'basic' && "bg-indigo-500 hover:bg-indigo-500 text-white",
                                            userPlan === 'enterprise' && "bg-slate-700 hover:bg-slate-700 text-white",
                                            userPlan === 'free' && "bg-slate-200 hover:bg-slate-200 text-slate-700"
                                        )}>
                                            {planLabel}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            )}
                        </button>

                        {/* Beautiful Floating Dropdown Popover */}
                        {isDropdownOpen && (
                            <div className={cn(
                                "absolute z-50 w-64 rounded-xl border border-sidebar-border bg-card text-card-foreground shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100",
                                isCollapsed ? "bottom-0 left-16 ml-2" : "bottom-0 left-64 ml-2"
                            )}>
                                {submenu === 'main' && (
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 border-b border-sidebar-border/60 mb-1">
                                            <p className="text-xs font-semibold text-foreground">{userName}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                <span className="text-[9px] text-muted-foreground">Plan activo:</span>
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase px-1 rounded",
                                                    userPlan === 'pro' && "text-amber-600 bg-amber-50",
                                                    userPlan === 'basic' && "text-indigo-600 bg-indigo-50",
                                                    userPlan === 'enterprise' && "text-slate-700 bg-slate-100",
                                                    userPlan === 'free' && "text-slate-500 bg-slate-50"
                                                )}>
                                                    {planLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/profile"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent transition-colors"
                                        >
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            <span>Mi Cuenta</span>
                                        </Link>

                                        <Link
                                            href="/settings"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent transition-colors"
                                        >
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                            <span>Configuración</span>
                                        </Link>

                                        <Link
                                            href="/help"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent transition-colors"
                                        >
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            <span>Ayuda</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setShowReferralModal(true);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent text-left transition-colors"
                                        >
                                            <Gift className="h-4 w-4 text-muted-foreground" />
                                            <span>Referir un amigo</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setShowFeedbackModal(true);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent text-left transition-colors"
                                        >
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            <span>Enviar comentarios</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setShowSupportModal(true);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent text-left transition-colors"
                                        >
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            <span>Contactar soporte</span>
                                        </button>

                                        <Link
                                            href="/research-hub"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <span>Research Hub</span>
                                            </div>
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                        </Link>

                                        <div className="border-t border-sidebar-border/60 my-1" />

                                        <button
                                            onClick={() => setSubmenu('languages')}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent text-left transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <span>Idioma</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <span>{language === 'es' ? 'Español' : 'English'}</span>
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setSubmenu('terms')}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-sidebar-accent text-left transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                <span>Políticas y Legal</span>
                                            </div>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>

                                        <div className="border-t border-sidebar-border/60 my-1" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-left"
                                        >
                                            <LogOut className="h-4 w-4 shrink-0 text-rose-600" />
                                            <span>Cerrar Sesión</span>
                                        </button>
                                    </div>
                                )}

                                {submenu === 'languages' && (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setSubmenu('main')}
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1 text-left"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            <span>Idiomas</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setLanguage('es');
                                                setIsDropdownOpen(false);
                                                setSubmenu('main');
                                                toast.success('Idioma cambiado a Español');
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-sidebar-accent text-left"
                                        >
                                            <span>Español</span>
                                            {language === 'es' && <Check className="h-4 w-4 text-indigo-600" />}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setLanguage('en');
                                                setIsDropdownOpen(false);
                                                setSubmenu('main');
                                                toast.success('Language changed to English');
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-sidebar-accent text-left"
                                        >
                                            <span>English</span>
                                            {language === 'en' && <Check className="h-4 w-4 text-indigo-600" />}
                                        </button>
                                    </div>
                                )}

                                {submenu === 'terms' && (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setSubmenu('main')}
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1 text-left"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            <span>Legal</span>
                                        </button>

                                        <Link
                                            href="/terms"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full block px-3 py-2 text-xs rounded-lg hover:bg-sidebar-accent text-left"
                                        >
                                            Términos y Condiciones
                                        </Link>

                                        <Link
                                            href="/privacy"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full block px-3 py-2 text-xs rounded-lg hover:bg-sidebar-accent text-left"
                                        >
                                            Políticas de Privacidad
                                        </Link>

                                        <Link
                                            href="/cookies"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full block px-3 py-2 text-xs rounded-lg hover:bg-sidebar-accent text-left"
                                        >
                                            Políticas de Cookies
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* --- MODALS SECTION --- */}

            {/* Referral Modal */}
            {showReferralModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-xl border border-sidebar-border shadow-2xl p-6 relative">
                        <button
                            onClick={() => setShowReferralModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="text-center space-y-3">
                            <div className="h-12 w-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                                🎁
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Refiere a un amigo</h3>
                            <p className="text-xs text-muted-foreground">
                                Comparte tu código único de referido. Cuando tu amigo se suscriba a un plan de pago, ambos recibirán un 50% de descuento en el próximo mes.
                            </p>
                        </div>
                        <div className="mt-6 p-4 bg-slate-50 border border-dashed rounded-lg flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-slate-700 tracking-wider text-center flex-1">ERPPANAMA50</span>
                            <Button size="sm" variant="outline" onClick={copyReferralCode}>
                                <Copy className="h-4 w-4 mr-1.5" />
                                Copiar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-xl border border-sidebar-border shadow-2xl p-6 relative">
                        <button
                            onClick={() => setShowFeedbackModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <form onSubmit={handleSendFeedback} className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Danos tu opinión</h3>
                            <p className="text-xs text-muted-foreground">
                                ¿Tienes ideas, reportes de fallos o sugerencias? Déjanos tus comentarios abajo.
                            </p>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Escribe tus comentarios aquí..."
                                className="w-full h-32 p-3 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowFeedbackModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmittingFeedback || !feedbackText.trim()}>
                                    {isSubmittingFeedback ? 'Enviando...' : 'Enviar'}
                                    <Send className="h-4 w-4 ml-1.5" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Support Modal */}
            {showSupportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-xl border border-sidebar-border shadow-2xl p-6 relative font-sans">
                        <button
                            onClick={() => setShowSupportModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <form onSubmit={handleSendSupport} className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Contactar Soporte</h3>
                            <p className="text-xs text-muted-foreground">
                                Nuestro equipo técnico está para ayudarte. Completa los detalles de tu consulta.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Asunto</label>
                                    <Input
                                        value={supportSubject}
                                        onChange={(e) => setSupportSubject(e.target.value)}
                                        placeholder="Ej. Error en facturación fiscal"
                                        className="text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Mensaje</label>
                                    <textarea
                                        value={supportMessage}
                                        onChange={(e) => setSupportMessage(e.target.value)}
                                        placeholder="Describe el inconveniente en detalle..."
                                        className="w-full h-24 p-3 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowSupportModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmittingSupport || !supportSubject.trim() || !supportMessage.trim()}>
                                    {isSubmittingSupport ? 'Enviando...' : 'Enviar Ticket'}
                                    <Send className="h-4 w-4 ml-1.5" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// Simple Badge component fallback in case it's not exported globally
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-gray-500/10",
            className
        )}>
            {children}
        </span>
    );
}
