'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Scan, MessageSquare, Shield, Tag, QrCode, Star, X, CheckCircle2, ArrowRight, Camera } from 'lucide-react';
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

        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            // Intentar autenticar con huella o Face ID existente
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
        } catch {
            // Si falla o no hay credencial guardada, intentamos crear una o mostrar modal guía
            try {
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
                    window.location.href = '/dashboard';
                    return;
                }
            } catch {
                // En lugar de mostrar un error técnico rojo, abrimos el modal informativo amable
                setActiveModal('bio_info');
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-3.5 flex flex-col justify-center my-auto relative">
            {/* Overlay Modals (Rendered directly in screen without scrolling) */}
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
                                <div className="w-12 h-12 bg-blue-100 text-[#0052cc] rounded-full flex items-center justify-center mx-auto">
                                    <Scan className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Vincular Huella / Face ID</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Para activar el ingreso instantáneo por biometría en este teléfono, primero ingresa con tu <strong>correo y contraseña</strong> la primera vez. Luego podrás activarlo en los ajustes de tu cuenta.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="w-full bg-[#002855] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#001f42] transition-all cursor-pointer"
                                >
                                    Entendido, ingresaré con contraseña
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
                                    className="block w-full bg-[#002855] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#001f42] transition-all text-center"
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
                                        <span className="font-extrabold text-[#0052cc]">$25/mes</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-blue-50 border-2 border-[#0052cc] flex justify-between items-center shadow-sm">
                                        <div>
                                            <span className="bg-[#0052cc] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Recomendado</span>
                                            <strong className="text-gray-900 block font-bold mt-0.5">Pyme Pro</strong>
                                            <span className="text-gray-500">5 Usuarios • Inventario • Reportes</span>
                                        </div>
                                        <span className="font-extrabold text-[#0052cc]">$50/mes</span>
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
                                    className="block w-full bg-[#002855] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#001f42] transition-all text-center shadow-md"
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
                                    className="w-full bg-[#002855] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#001f42] transition-all cursor-pointer"
                                >
                                    Ingresar para Escanear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Logo Mobile / Header */}
            <div className="flex items-center justify-center gap-2 pt-1">
                <div className="bg-white/20 lg:bg-primary/10 p-1.5 rounded-xl backdrop-blur-sm">
                    <Star className="h-7 w-7 fill-white text-white lg:fill-primary lg:text-primary" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white lg:text-foreground">
                    ERP Panamá
                </span>
            </div>

            {/* Banco General Inspired Banner Placeholder */}
            <div className="bg-white/10 lg:bg-primary/5 border border-white/25 lg:border-primary/10 rounded-2xl p-3 text-center backdrop-blur-md shadow-sm">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 lg:bg-primary/10 text-[10px] font-bold text-white lg:text-primary uppercase tracking-wider mb-1">
                    Espacio para Imagen
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white lg:text-foreground leading-snug">
                    Ve por tu historia / Nosotros te acompañamos en tu gestión fiscal
                </p>
            </div>

            {error && (
                <Alert variant="error" className="bg-red-500/95 text-white border-none rounded-xl shadow-md py-2 text-xs">
                    {error}
                </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Username/Email Input */}
                <div className="bg-white rounded-2xl p-1.5 shadow-md flex items-center gap-2.5 border border-transparent focus-within:ring-2 focus-within:ring-blue-300 transition-all text-gray-800">
                    <User className="h-5 w-5 text-gray-400 ml-2 shrink-0" />
                    <input
                        type="email"
                        placeholder="Usuario o Correo DGI"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none w-full py-1.5 text-sm sm:text-base font-medium"
                    />
                    {email && (
                        <button
                            type="button"
                            onClick={() => setEmail('')}
                            className="text-gray-400 hover:text-gray-600 px-2 text-xs font-bold cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Password Input + Biometric Button */}
                <div className="flex gap-2 items-center">
                    <div className="bg-white rounded-2xl p-1.5 shadow-md flex items-center gap-2.5 flex-1 border border-transparent focus-within:ring-2 focus-within:ring-blue-300 transition-all text-gray-800">
                        <Lock className="h-5 w-5 text-gray-400 ml-2 shrink-0" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none w-full py-1.5 text-sm sm:text-base font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs font-bold text-[#0052cc] hover:text-[#003366] px-2 shrink-0 transition-colors cursor-pointer"
                        >
                            {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </div>

                    {/* Biometric Scan Button */}
                    <button
                        type="button"
                        onClick={handleBiometricLogin}
                        title="Ingresar con biometría"
                        className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md flex items-center justify-center text-[#0052cc] hover:bg-blue-50 transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                        <Scan className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Submit button (Entrar) */}
                <div className="pt-1">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#002855] hover:bg-[#001f42] lg:bg-primary lg:hover:bg-primary/90 text-white font-extrabold text-base sm:text-lg py-3.5 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer tracking-wide"
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Entrar'}
                    </button>
                </div>
            </form>

            {/* Forgot password link */}
            <div className="text-center">
                <Link
                    href="/forgot-password"
                    className="text-white lg:text-primary font-bold text-xs sm:text-sm hover:underline tracking-wide"
                >
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>

            {/* Create account outline button */}
            <div>
                <Link
                    href="/register"
                    className="block w-full border border-white/80 lg:border-primary text-white lg:text-primary font-bold text-sm sm:text-base py-2.5 sm:py-3 rounded-2xl text-center hover:bg-white/10 lg:hover:bg-primary/5 transition-all shadow-sm"
                >
                    Crea tu usuario o abre tu cuenta
                </Link>
            </div>

            {/* Google login option */}
            <div>
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full bg-white/95 lg:bg-white text-gray-800 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-2xl shadow-md hover:bg-white flex items-center justify-center gap-2 transition-all border border-gray-200/80 cursor-pointer"
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

            {/* Version */}
            <p className="text-center text-[11px] font-medium text-white/70 lg:text-gray-400">
                Versión 1.0.0 (ERP Panamá)
            </p>

            {/* Bottom Quick Action Cards Grid (Real ERP Interactive Overlays) */}
            <div className="grid grid-cols-4 gap-2 pt-1 w-full">
                <button
                    type="button"
                    onClick={() => setActiveModal('soporte')}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-[11px] font-semibold shadow-sm cursor-pointer"
                >
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Soporte</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveModal('seguridad')}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-[11px] font-semibold shadow-sm cursor-pointer"
                >
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Seguridad</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveModal('planes')}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-[11px] font-semibold shadow-sm cursor-pointer"
                >
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Planes</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveModal('qr')}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-[11px] font-semibold shadow-sm cursor-pointer"
                >
                    <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Lector QR</span>
                </button>
            </div>
        </div>
    );
}
