'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { User, Lock, Fingerprint, MessageSquare, Shield, Star, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/firebase/auth';

type ModalType = 'soporte' | 'bio_info' | null;

export default function LoginPage() {

    const { signInWithGoogle, signInWithEmail, user, loading, error: authError } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            window.location.href = '/dashboard';
        }
    }, [user, loading]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signInWithEmail(email, password);
            window.location.href = '/dashboard';
        } catch (err: unknown) {
            const error = err as { code?: string };
            if (error.code === 'auth/user-not-found') {
                setError('Usuario no encontrado');
            } else if (error.code === 'auth/wrong-password') {
                setError('Contraseña incorrecta');
            } else if (error.code === 'auth/invalid-credential') {
                setError('Credenciales inválidas');
            } else {
                setError('Error al iniciar sesión. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleLoading(true);

        try {
            await signInWithGoogle();
            window.location.href = '/dashboard';
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            console.error('Google Login Error:', error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                setError('No se pudo conectar con Google. Intenta de nuevo.');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleBiometricLogin = () => {
        // El login biométrico requiere verificación de challenge WebAuthn contra el
        // servidor (no implementada todavía). Hasta que exista ese endpoint, no debe
        // autenticar a nadie basado solo en un credential truthy del navegador.
        setError('');
        setActiveModal('bio_info');
    };

    return (
        <div className="w-full relative">
            {/* Overlay Modals */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-foreground shadow-2xl relative space-y-4 border border-border">
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            aria-label="Cerrar"
                            className="absolute top-4 right-4 p-1 rounded-full bg-muted hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {activeModal === 'bio_info' && (
                            <div className="text-center space-y-3">
                                <div className="w-12 h-12 bg-info-bg text-info rounded-full flex items-center justify-center mx-auto">
                                    <Fingerprint className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-black text-foreground">Login biométrico próximamente</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Estamos preparando el ingreso con huella digital o Face ID de forma segura. Por ahora, ingresa con tu correo y contraseña.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="w-full bg-brand-2 text-white font-bold py-3 rounded-xl text-sm hover:bg-brand-1 transition-all cursor-pointer"
                                >
                                    Entendido
                                </button>
                            </div>
                        )}

                        {activeModal === 'soporte' && (
                            <div className="text-center space-y-3">
                                <div className="w-12 h-12 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-black text-foreground">Soporte DGI 24/7</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Contamos con especialistas en facturación electrónica PAC y firma fiscal disponibles para ayudarte en todo momento.
                                </p>
                                <Link
                                    href="/help"
                                    className="block w-full bg-success text-white font-bold py-3 rounded-xl text-sm hover:bg-success/90 transition-all text-center"
                                >
                                    Ir al Centro de Ayuda
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <Alert variant="error" className="bg-danger/95 text-white border-none rounded-xl shadow-md py-2 text-xs mb-3">
                    {error}
                </Alert>
            )}

            {/* =========================================================
                VISTA MÓVIL (< lg) - Estilo Banco General
            ========================================================= */}
            <div className="flex lg:hidden w-full max-w-md mx-auto flex-col justify-between gap-3 overflow-x-hidden px-4 sm:px-6 py-2 min-w-0">
                {/* Cabecera & Logo Mobile */}
                <div className="flex items-center justify-center gap-2 shrink-0 pt-0.5">
                    <div className="bg-white/20 p-1 rounded-xl backdrop-blur-sm">
                        <Star className="h-5 w-5 fill-white text-white" />
                    </div>
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                        ERP Panamá
                    </span>
                </div>

                {/* Panel de marca institucional (equivalente móvil del panel derecho de escritorio) */}
                <div className="relative h-[22vh] min-h-[110px] max-h-[170px] w-full bg-white/10 border border-white/25 rounded-3xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-md shadow-md shrink-0 my-1 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 bg-white/15 p-2 rounded-xl mb-2">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <p className="relative z-10 text-xs sm:text-sm font-bold text-white leading-snug max-w-[260px] break-words">
                        Facturación electrónica, inventario y contabilidad, cumpliendo con la DGI en un solo lugar.
                    </p>
                </div>

                {/* Formulario con Espaciados Fieles a la Referencia */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 shrink-0 w-full min-w-0">
                    {/* Input 1: Usuario / Correo */}
                    <div className="bg-white rounded-2xl h-11 sm:h-12 px-3.5 shadow-sm flex items-center gap-2.5 text-foreground w-full min-w-0">
                        <User className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                        <Label htmlFor="login-email-mobile" className="sr-only">Usuario o correo</Label>
                        <Input
                            id="login-email-mobile"
                            type="email"
                            placeholder="Usuario o Correo DGI"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-auto border-none shadow-none bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 w-full min-w-0 text-xs sm:text-sm font-medium"
                        />
                        {email && (
                            <button
                                type="button"
                                onClick={() => setEmail('')}
                                aria-label="Limpiar campo de correo"
                                className="text-muted-foreground hover:text-foreground px-1 text-sm font-bold cursor-pointer shrink-0"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Input 2: Contraseña + Botón Biométrico */}
                    <div className="flex gap-2 items-center w-full min-w-0">
                        <div className="bg-white rounded-2xl h-11 sm:h-12 px-3.5 shadow-sm flex items-center gap-2 flex-1 text-foreground min-w-0">
                            <Lock className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                            <Label htmlFor="login-password-mobile" className="sr-only">Contraseña</Label>
                            <Input
                                id="login-password-mobile"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="h-auto border-none shadow-none bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 w-full min-w-0 text-xs sm:text-sm font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs font-bold text-brand-medium hover:text-brand-bg-blue px-1 shrink-0 transition-colors cursor-pointer"
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleBiometricLogin}
                            title="Login biométrico (próximamente)"
                            aria-label="Login biométrico (próximamente)"
                            className="bg-white rounded-2xl h-11 w-11 sm:h-12 sm:w-12 shadow-sm flex items-center justify-center text-brand-medium hover:bg-info-bg transition-all shrink-0 active:scale-95 cursor-pointer"
                        >
                            <Fingerprint className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>

                    {/* Botón Entrar */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-bg-blue hover:bg-brand-bg-blue-hover-dark text-white font-bold text-sm sm:text-base h-11 sm:h-12 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer tracking-wide truncate"
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Entrar'}
                    </button>
                </form>

                {/* Enlaces Secundarios */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 w-full min-w-0">
                    <Link href="/forgot-password" className="text-white font-bold text-xs sm:text-sm hover:underline truncate max-w-full">
                        ¿Olvidaste tu contraseña?
                    </Link>

                    <Link href="/register" className="w-full border border-white/80 rounded-2xl py-2 px-4 text-center text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition-all truncate">
                        Crea tu usuario o abre tu cuenta
                    </Link>

                    {/* Botón Google restaurado */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full bg-white/90 text-foreground font-semibold text-xs h-10 px-3 rounded-2xl shadow hover:bg-white flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
                    >
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="truncate">{isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
                    </button>

                    <span className="text-[10px] text-white/60 tracking-wide">
                        Versión 1.0.0
                    </span>
                </div>

                {/* Soporte (único control decorativo restante; el resto de tarjetas
                    promocionales/no-funcionales del diseño anterior se retiraron para
                    reducir ruido cognitivo en una pantalla de login de 2 campos) */}
                <div className="shrink-0 pb-0.5 w-full min-w-0 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setActiveModal('soporte')}
                        className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        ¿Necesitas ayuda? Contactar soporte
                    </button>
                </div>
            </div>


            {/* =========================================================
                VISTA ESCRITORIO / LAPTOP (>= lg) - Formal Institucional
            ========================================================= */}
            <div className="hidden lg:flex w-full max-w-md mx-auto flex-col justify-center text-left">
                {/* Título & Subtítulo Formal */}
                <h2 className="text-3xl font-extrabold text-brand-2 tracking-tight mb-1">
                    Iniciar Sesión
                </h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">
                    Ingresa a tu portal de facturación y gestión fiscal
                </p>

                {/* Formulario Escritorio */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="bg-white border border-border rounded-xl px-3.5 py-2.5 flex items-center gap-3 focus-within:border-brand-1 focus-within:ring-2 focus-within:ring-brand-1/10 transition-all shadow-sm">
                        <User className="h-5 w-5 text-muted-foreground shrink-0" />
                        <Label htmlFor="login-email-desktop" className="sr-only">Usuario o correo</Label>
                        <Input
                            id="login-email-desktop"
                            type="email"
                            placeholder="Usuario o Correo DGI"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-auto border-none shadow-none bg-transparent p-0 text-sm text-foreground font-medium placeholder:text-muted-foreground focus-visible:ring-0"
                        />
                    </div>

                    <div className="flex gap-2.5 items-center">
                        <div className="bg-white border border-border rounded-xl px-3.5 py-2.5 flex items-center gap-3 flex-1 focus-within:border-brand-1 focus-within:ring-2 focus-within:ring-brand-1/10 transition-all shadow-sm">
                            <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                            <Label htmlFor="login-password-desktop" className="sr-only">Contraseña</Label>
                            <Input
                                id="login-password-desktop"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="h-auto border-none shadow-none bg-transparent p-0 text-sm text-foreground font-medium placeholder:text-muted-foreground focus-visible:ring-0"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs font-bold text-brand-1 hover:text-brand-2 px-1 shrink-0 transition-colors cursor-pointer"
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>

                        {/* Botón biométrico lateral idéntico al screenshot */}
                        <button
                            type="button"
                            onClick={handleBiometricLogin}
                            title="Login biométrico (próximamente)"
                            aria-label="Login biométrico (próximamente)"
                            className="bg-white border border-border rounded-xl p-3 shadow-sm flex items-center justify-center text-brand-1 hover:bg-info-bg transition-all shrink-0 active:scale-95 cursor-pointer"
                        >
                            <Fingerprint className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-2 hover:bg-brand-1 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 text-sm tracking-wide cursor-pointer"
                        >
                            {isLoading ? 'Conectando...' : 'Entrar'}
                        </button>
                    </div>
                </form>

                {/* Enlace Olvidaste Contraseña */}
                <div className="text-center my-4">
                    <Link href="/forgot-password" className="text-xs font-bold text-brand-1 hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {/* Botones secundarios */}
                <div className="space-y-3">
                    <Link
                        href="/register"
                        className="block w-full border border-brand-1 text-brand-1 font-bold py-3 rounded-xl text-sm hover:bg-info-bg transition-all text-center shadow-sm"
                    >
                        Crea tu usuario o abre tu cuenta
                    </Link>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full bg-white border border-border text-foreground font-semibold py-3 rounded-xl shadow-sm hover:bg-accent flex items-center justify-center gap-2.5 text-sm transition-all cursor-pointer"
                    >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{isGoogleLoading ? 'Conectando...' : 'O continuar con Google'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
