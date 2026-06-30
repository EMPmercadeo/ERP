'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Fingerprint, MessageSquare, Shield, Tag, QrCode, Star, X, Eye, EyeOff, Camera } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/lib/firebase/auth';

type ModalType = 'soporte' | 'seguridad' | 'planes' | 'qr' | 'bio_info' | null;

export default function LoginPage() {
    const router = useRouter();
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
                setError(`Error al conectar con Google (${error.code || 'Desconocido'}).`);
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        setError('');
        if (typeof window === 'undefined' || !window.PublicKeyCredential) {
            setActiveModal('bio_info');
            return;
        }

        const isRegistered = localStorage.getItem('erp_passkey_saved') === 'true';

        try {
            if (isRegistered) {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);
                const credential = await navigator.credentials.get({
                    publicKey: {
                        challenge: challenge,
                        timeout: 60000,
                        userVerification: "required"
                    }
                });

                if (credential) {
                    window.location.href = '/dashboard';
                    return;
                }
            } else {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);
                const userId = new Uint8Array(16);
                window.crypto.getRandomValues(userId);

                const newCredential = await navigator.credentials.create({
                    publicKey: {
                        challenge: challenge,
                        rp: { name: "ERP Panamá" },
                        user: {
                            id: userId,
                            name: email || "usuario@erppanama.com",
                            displayName: email || "Usuario ERP Panamá",
                        },
                        pubKeyCredParams: [
                            { type: "public-key", alg: -7 },
                            { type: "public-key", alg: -257 }
                        ],
                        authenticatorSelection: {
                            authenticatorAttachment: "platform",
                            userVerification: "required"
                        },
                        timeout: 60000
                    }
                });

                if (newCredential) {
                    localStorage.setItem('erp_passkey_saved', 'true');
                    window.location.href = '/dashboard';
                    return;
                }
            }
        } catch {
            if (isRegistered) {
                localStorage.removeItem('erp_passkey_saved');
            }
            setActiveModal('bio_info');
        }
    };

    return (
        <div className="w-full relative">
            {/* Overlay Modals */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-gray-800 shadow-2xl relative space-y-4 border border-gray-100">
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {activeModal === 'bio_info' && (
                            <div className="text-center space-y-3">
                                <div className="w-12 h-12 bg-blue-100 text-[#073674] rounded-full flex items-center justify-center mx-auto">
                                    <Fingerprint className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Permiso Biométrico DGI</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Para autorizar tu huella digital o Face ID en este dispositivo, escribe tu correo y pulsa el ícono de huella nuevamente para vincular la seguridad del dispositivo con tu cuenta.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveModal(null);
                                        localStorage.removeItem('erp_passkey_saved');
                                    }}
                                    className="w-full bg-[#052550] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#073674] transition-all cursor-pointer"
                                >
                                    Entendido, autorizar ahora
                                </button>
                            </div>
                        )}

                        {activeModal === 'soporte' && (
                            <div className="text-center space-y-3">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Soporte DGI 24/7</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Contamos con especialistas en facturación electrónica PAC y firma fiscal disponibles para ayudarte en todo momento.
                                </p>
                                <Link
                                    href="/help"
                                    className="block w-full bg-green-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-green-700 transition-all text-center"
                                >
                                    Ir al Centro de Ayuda
                                </Link>
                            </div>
                        )}

                        {activeModal === 'seguridad' && (
                            <div className="text-center space-y-3">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Seguridad Bancaria</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Tus certificados fiscales (.p12) y las llaves contables están blindados con encriptación militar AES-256 en servidores certificados.
                                </p>
                                <Link
                                    href="/privacy"
                                    className="block w-full bg-[#052550] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#073674] transition-all text-center"
                                >
                                    Ver Políticas de Seguridad
                                </Link>
                            </div>
                        )}

                        {activeModal === 'planes' && (
                            <div className="space-y-3">
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-gray-900">Planes ERP Panamá</h3>
                                    <p className="text-xs text-gray-500">Facturación ilimitada sin costos ocultos</p>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex justify-between items-center">
                                        <div>
                                            <strong className="text-gray-900 block font-bold">Emprendedor</strong>
                                            <span className="text-gray-500">1 Usuario • Facturas ilimitadas</span>
                                        </div>
                                        <span className="font-extrabold text-[#073674]">$25/mes</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-blue-50 border-2 border-[#073674] flex justify-between items-center shadow-sm">
                                        <div>
                                            <span className="bg-[#073674] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Recomendado</span>
                                            <strong className="text-gray-900 block font-bold mt-0.5">Pyme Pro</strong>
                                            <span className="text-gray-500">5 Usuarios • Inventario • Reportes</span>
                                        </div>
                                        <span className="font-extrabold text-[#073674]">$50/mes</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center">
                                        <div>
                                            <strong className="text-gray-900 block font-bold">Corporativo</strong>
                                            <span className="text-gray-500">Multisucursal • API • Contabilidad</span>
                                        </div>
                                        <span className="font-extrabold text-gray-700">$120/mes</span>
                                    </div>
                                </div>
                                <Link
                                    href="/register"
                                    className="block w-full bg-[#052550] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#073674] transition-all text-center shadow-md"
                                >
                                    Comenzar Prueba Gratis
                                </Link>
                            </div>
                        )}

                        {activeModal === 'qr' && (
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto text-white border-2 border-dashed border-blue-400 relative animate-pulse">
                                    <Camera className="h-8 w-8 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Verificador QR DGI</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Escanea el código QR de cualquier factura electrónica o albarán para auditar su validez en tiempo real ante el PAC y la DGI.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setActiveModal(null); }}
                                    className="w-full bg-[#052550] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#073674] transition-all cursor-pointer"
                                >
                                    Ingresar para Escanear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <Alert variant="error" className="bg-red-500/95 text-white border-none rounded-xl shadow-md py-2 text-xs mb-3">
                    {error}
                </Alert>
            )}

            {/* =========================================================
                VISTA MÓVIL (< lg) - Estilo Banco General
            ========================================================= */}
            <div className="flex lg:hidden w-full max-w-md mx-auto h-full flex-col justify-evenly overflow-hidden">
                {/* Cabecera & Logo Mobile */}
                <div className="flex items-center justify-center gap-2 shrink-0 pt-0.5">
                    <div className="bg-white/20 p-1 rounded-xl backdrop-blur-sm">
                        <Star className="h-5 w-5 fill-white text-white" />
                    </div>
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                        ERP Panamá
                    </span>
                </div>

                {/* Banner de Imagen (Exactamente 25vh según requerimiento) */}
                <div className="h-[25vh] min-h-[130px] w-full bg-white/10 border border-white/25 rounded-3xl p-3.5 flex flex-col items-center justify-center text-center backdrop-blur-md shadow-md shrink-0 my-1">
                    <div className="inline-block px-3 py-0.5 rounded-full bg-white/25 text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                        Espacio para Imagen (25vh)
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-white leading-snug max-w-[260px]">
                        Ve por tu historia / Nosotros te acompañamos en tu gestión fiscal
                    </p>
                </div>

                {/* Formulario con Espaciados Fieles a la Referencia */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 shrink-0">
                    {/* Input 1: Usuario / Correo */}
                    <div className="bg-white rounded-2xl h-11 sm:h-12 px-3.5 shadow-sm flex items-center gap-2.5 text-gray-800">
                        <User className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                        <input
                            type="email"
                            placeholder="Usuario o Correo DGI"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none w-full text-xs sm:text-sm font-medium"
                        />
                        {email && (
                            <button
                                type="button"
                                onClick={() => setEmail('')}
                                className="text-gray-400 hover:text-gray-600 px-1 text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Input 2: Contraseña + Botón Biométrico */}
                    <div className="flex gap-2 items-center">
                        <div className="bg-white rounded-2xl h-11 sm:h-12 px-3.5 shadow-sm flex items-center gap-2 flex-1 text-gray-800">
                            <Lock className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none w-full text-xs sm:text-sm font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs font-bold text-[#004899] hover:text-[#002855] px-1 shrink-0 transition-colors cursor-pointer"
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleBiometricLogin}
                            title="Ingresar con Huella Digital"
                            className="bg-white rounded-2xl h-11 w-11 sm:h-12 sm:w-12 shadow-sm flex items-center justify-center text-[#004899] hover:bg-blue-50 transition-all shrink-0 active:scale-95 cursor-pointer"
                        >
                            <Fingerprint className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>

                    {/* Botón Entrar */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#002855] hover:bg-[#001d3f] text-white font-bold text-sm sm:text-base h-11 sm:h-12 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer tracking-wide"
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Entrar'}
                    </button>
                </form>

                {/* Enlaces Secundarios */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <Link href="/forgot-password" className="text-white font-bold text-xs sm:text-sm hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>

                    <Link href="/register" className="w-full border border-white/80 rounded-2xl py-2 px-4 text-center text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition-all">
                        Crea tu usuario o abre tu cuenta
                    </Link>

                    {/* Botón Google restaurado */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full bg-white/90 text-gray-800 font-semibold text-xs h-10 px-3 rounded-2xl shadow hover:bg-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
                    </button>

                    <span className="text-[10px] text-white/60 tracking-wide">
                        Versión 1.0.0
                    </span>
                </div>

                {/* 4 Tarjetas Inferiores */}
                <div className="shrink-0 pb-0.5">
                    <div className="grid grid-cols-4 gap-2">
                        <button type="button" onClick={() => setActiveModal('soporte')} className="border border-white/40 rounded-2xl p-1.5 flex flex-col items-center justify-center hover:bg-white/10 transition-all aspect-square cursor-pointer">
                            <MessageSquare className="h-4.5 w-4.5 mb-0.5 text-white" />
                            <span className="text-[9px] font-semibold text-white">Contactar</span>
                        </button>
                        <button type="button" onClick={() => setActiveModal('seguridad')} className="border border-white/40 rounded-2xl p-1.5 flex flex-col items-center justify-center hover:bg-white/10 transition-all aspect-square cursor-pointer">
                            <Shield className="h-4.5 w-4.5 mb-0.5 text-white" />
                            <span className="text-[9px] font-semibold text-white">Token</span>
                        </button>
                        <button type="button" onClick={() => setActiveModal('planes')} className="border border-white/40 rounded-2xl p-1.5 flex flex-col items-center justify-center hover:bg-white/10 transition-all aspect-square cursor-pointer">
                            <Tag className="h-4.5 w-4.5 mb-0.5 text-white" />
                            <span className="text-[9px] font-semibold text-white">Planes</span>
                        </button>
                        <button type="button" onClick={() => setActiveModal('qr')} className="border border-white/40 rounded-2xl p-1.5 flex flex-col items-center justify-center hover:bg-white/10 transition-all aspect-square cursor-pointer">
                            <QrCode className="h-4.5 w-4.5 mb-0.5 text-white" />
                            <span className="text-[9px] font-semibold text-white">Lector QR</span>
                        </button>
                    </div>
                </div>
            </div>


            {/* =========================================================
                VISTA ESCRITORIO / LAPTOP (>= lg) - Formal Institucional
            ========================================================= */}
            <div className="hidden lg:flex w-full max-w-md mx-auto flex-col justify-center text-left">
                {/* Título & Subtítulo Formal */}
                <h2 className="text-3xl font-extrabold text-[#052550] tracking-tight mb-1">
                    Iniciar Sesión
                </h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                    Ingresa a tu portal de facturación y gestión fiscal
                </p>

                {/* Formulario Escritorio */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 flex items-center gap-3 focus-within:border-[#073674] focus-within:ring-2 focus-within:ring-[#073674]/10 transition-all shadow-sm">
                        <User className="h-5 w-5 text-gray-400 shrink-0" />
                        <input
                            type="email"
                            placeholder="Usuario o Correo DGI"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-transparent text-sm text-gray-900 font-medium placeholder:text-gray-400 outline-none"
                        />
                    </div>

                    <div className="flex gap-2.5 items-center">
                        <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 flex items-center gap-3 flex-1 focus-within:border-[#073674] focus-within:ring-2 focus-within:ring-[#073674]/10 transition-all shadow-sm">
                            <Lock className="h-5 w-5 text-gray-400 shrink-0" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-transparent text-sm text-gray-900 font-medium placeholder:text-gray-400 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs font-bold text-[#073674] hover:text-[#052550] px-1 shrink-0 transition-colors cursor-pointer"
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>

                        {/* Botón biométrico lateral idéntico al screenshot */}
                        <button
                            type="button"
                            onClick={handleBiometricLogin}
                            title="Ingresar con Huella Digital / Passkey"
                            className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-center text-[#073674] hover:bg-blue-50/60 transition-all shrink-0 active:scale-95 cursor-pointer"
                        >
                            <Fingerprint className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#052550] hover:bg-[#073674] text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 text-sm tracking-wide cursor-pointer"
                        >
                            {isLoading ? 'Conectando...' : 'Entrar'}
                        </button>
                    </div>
                </form>

                {/* Enlace Olvidaste Contraseña */}
                <div className="text-center my-4">
                    <Link href="/forgot-password" className="text-xs font-bold text-[#073674] hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {/* Botones secundarios */}
                <div className="space-y-3">
                    <Link
                        href="/register"
                        className="block w-full border border-[#073674] text-[#073674] font-bold py-3 rounded-xl text-sm hover:bg-blue-50/50 transition-all text-center shadow-sm"
                    >
                        Crea tu usuario o abre tu cuenta
                    </Link>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2.5 text-sm transition-all cursor-pointer"
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
