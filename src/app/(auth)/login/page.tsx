'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Scan, MessageSquare, Shield, Tag, QrCode, Star, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/lib/firebase/auth';

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, signInWithEmail, user, loading, error: authError } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            window.location.href = '/dashboard';
        }
    }, [user, loading]);

    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');

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
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                // User closed the popup, not an error
            } else if (error.code === 'auth/unauthorized-domain') {
                setError('Dominio no autorizado en Firebase. Añade este dominio en Firebase Console -> Authentication -> Settings -> Authorized domains.');
            } else if (error.code === 'auth/operation-not-allowed') {
                setError('El inicio de sesión con Google no está habilitado en Firebase Console -> Authentication -> Sign-in method.');
            } else {
                setError(`Error al iniciar sesión con Google (${error.code || error.message || 'Error desconocido'}).`);
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6 flex flex-col justify-center">
            {/* Logo Mobile / Header */}
            <div className="flex items-center justify-center gap-2.5 pt-2 pb-1">
                <div className="bg-white/20 lg:bg-primary/10 p-2 rounded-xl backdrop-blur-sm">
                    <Star className="h-8 w-8 fill-white text-white lg:fill-primary lg:text-primary" />
                </div>
                <span className="text-3xl font-extrabold tracking-tight text-white lg:text-foreground">
                    ERP Panamá
                </span>
            </div>

            {/* Banner Image Placeholder Space */}
            <div className="w-full bg-gradient-to-br from-[#003366] via-[#004080] to-[#0A52A6] lg:from-blue-600 lg:to-indigo-700 rounded-3xl p-6 text-white shadow-xl border border-white/20 relative overflow-hidden flex flex-col justify-end min-h-[165px]">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-white/30">
                    Espacio para Imagen
                </div>
                <div className="relative z-10 space-y-1">
                    <h3 className="text-2xl font-black tracking-tight leading-none">Ve por tu historia</h3>
                    <p className="text-sm text-blue-100 font-medium">Nosotros te acompañamos en tu gestión fiscal</p>
                </div>
                {/* Decorative background shape */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            </div>

            {error && (
                <Alert variant="error" className="bg-red-500/90 text-white border-none rounded-2xl shadow-lg">
                    {error}
                </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email / User input pill */}
                <div className="bg-white rounded-2xl p-2 shadow-lg flex items-center gap-3 border border-transparent focus-within:ring-2 focus-within:ring-blue-300 transition-all text-gray-800">
                    <User className="h-5 w-5 text-gray-400 ml-2 shrink-0" />
                    <input
                        type="email"
                        placeholder="Usuario o correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none w-full py-2 text-base font-medium"
                    />
                    {email && (
                        <button
                            type="button"
                            onClick={() => setEmail('')}
                            className="p-1.5 text-gray-400 hover:text-gray-600 mr-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Password input row + Biometric button */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white rounded-2xl p-2 shadow-lg flex items-center gap-3 border border-transparent focus-within:ring-2 focus-within:ring-blue-300 transition-all text-gray-800">
                        <Lock className="h-5 w-5 text-gray-400 ml-2 shrink-0" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none w-full py-2 text-base font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-sm font-bold text-[#0052cc] hover:text-[#003366] px-3 shrink-0 transition-colors cursor-pointer"
                        >
                            {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </div>

                    {/* Biometric Scan Button */}
                    <button
                        type="button"
                        onClick={() => alert('Escáner biométrico / Token habilitado')}
                        title="Ingresar con biometría"
                        className="bg-white rounded-2xl p-4 shadow-lg flex items-center justify-center text-[#0052cc] hover:bg-blue-50 transition-all shrink-0 active:scale-95"
                    >
                        <Scan className="h-6 w-6" />
                    </button>
                </div>

                {/* Submit button (Entrar) */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#002855] hover:bg-[#001f42] lg:bg-primary lg:hover:bg-primary/90 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer tracking-wide"
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Entrar'}
                    </button>
                </div>
            </form>

            {/* Forgot password link */}
            <div className="text-center pt-1">
                <Link
                    href="/forgot-password"
                    className="text-white lg:text-primary font-bold text-sm hover:underline tracking-wide"
                >
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>

            {/* Create account outline button */}
            <div className="pt-2">
                <Link
                    href="/register"
                    className="block w-full border-2 border-white/80 lg:border-primary text-white lg:text-primary font-bold text-base py-3.5 rounded-2xl text-center hover:bg-white/10 lg:hover:bg-primary/5 transition-all shadow-sm"
                >
                    Crea tu usuario o abre tu cuenta
                </Link>
            </div>

            {/* Google login option */}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full bg-white/95 lg:bg-white text-gray-800 font-semibold text-sm py-3 px-4 rounded-2xl shadow-md hover:bg-white flex items-center justify-center gap-2.5 transition-all border border-gray-200/80 cursor-pointer"
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
            <p className="text-center text-xs font-medium text-white/70 lg:text-gray-400 pt-1">
                Versión 7.1.196839
            </p>

            {/* Bottom Quick Action Cards Grid (Exactly like reference) */}
            <div className="grid grid-cols-4 gap-2.5 pt-4 w-full">
                <button
                    type="button"
                    onClick={() => alert('Soporte en línea disponible')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-xs font-semibold shadow-sm cursor-pointer"
                >
                    <MessageSquare className="h-5 w-5" />
                    <span>Contactar</span>
                </button>
                <button
                    type="button"
                    onClick={() => alert('Token de seguridad activo')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-xs font-semibold shadow-sm cursor-pointer"
                >
                    <Shield className="h-5 w-5" />
                    <span>Token</span>
                </button>
                <button
                    type="button"
                    onClick={() => alert('Consulta nuestras promociones y planes')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-xs font-semibold shadow-sm cursor-pointer"
                >
                    <Tag className="h-5 w-5" />
                    <span>Promociones</span>
                </button>
                <button
                    type="button"
                    onClick={() => alert('Lector QR de Facturas DGI')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-white/25 lg:border-gray-200 bg-white/10 lg:bg-gray-50 backdrop-blur-md text-white lg:text-gray-700 hover:bg-white/20 lg:hover:bg-gray-100 transition-all text-xs font-semibold shadow-sm cursor-pointer"
                >
                    <QrCode className="h-5 w-5" />
                    <span>Lector QR</span>
                </button>
            </div>
        </div>
    );
}
