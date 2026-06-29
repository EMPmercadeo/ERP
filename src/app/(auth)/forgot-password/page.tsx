'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Star, CheckCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/lib/firebase/auth';

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            console.error('Reset password error:', error);
            if (error.code === 'auth/user-not-found') {
                setError('No existe ningún usuario registrado con este correo.');
            } else if (error.code === 'auth/invalid-email') {
                setError('El correo ingresado no es válido.');
            } else {
                setError('Ocurrió un error al enviar el correo. Por favor verifica e intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6 flex flex-col justify-center">
            {/* Header */}
            <div className="flex items-center justify-center gap-2.5 pt-2 pb-1">
                <div className="bg-white/20 lg:bg-primary/10 p-2 rounded-xl backdrop-blur-sm">
                    <Star className="h-8 w-8 fill-white text-white lg:fill-primary lg:text-primary" />
                </div>
                <span className="text-3xl font-extrabold tracking-tight text-white lg:text-foreground">
                    ERP Panamá
                </span>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white lg:text-foreground">Recuperar Contraseña</h2>
                <p className="text-sm text-blue-100 lg:text-gray-500">
                    Ingresa tu correo institucional y te enviaremos las instrucciones para restablecer tu contraseña.
                </p>
            </div>

            {error && (
                <Alert variant="error" className="bg-red-500/90 text-white border-none rounded-2xl shadow-lg">
                    {error}
                </Alert>
            )}

            {success ? (
                <div className="bg-white lg:bg-green-50 rounded-3xl p-6 text-center space-y-4 shadow-xl border border-green-200">
                    <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">¡Correo enviado!</h3>
                    <p className="text-sm text-gray-600">
                        Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada o spam.
                    </p>
                    <Link
                        href="/login"
                        className="block w-full bg-[#002855] lg:bg-primary text-white font-bold py-3.5 rounded-2xl transition-all shadow-md"
                    >
                        Volver a Iniciar Sesión
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white rounded-2xl p-2 shadow-lg flex items-center gap-3 border border-transparent focus-within:ring-2 focus-within:ring-blue-300 transition-all text-gray-800">
                        <Mail className="h-5 w-5 text-gray-400 ml-2 shrink-0" />
                        <input
                            type="email"
                            placeholder="correo@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none w-full py-2 text-base font-medium"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#002855] hover:bg-[#001f42] lg:bg-primary lg:hover:bg-primary/90 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer tracking-wide"
                        >
                            {isLoading ? 'Enviando instrucciones...' : 'Enviar Enlace'}
                        </button>
                    </div>
                </form>
            )}

            <div className="text-center pt-2">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-white lg:text-primary font-bold text-sm hover:underline tracking-wide"
                >
                    <ArrowLeft className="h-4 w-4" /> Volver al Inicio de Sesión
                </Link>
            </div>
        </div>
    );
}
