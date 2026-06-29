'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/firebase/auth';

export default function RegisterPage() {
    const router = useRouter();
    const { signUpWithEmail, signInWithGoogle } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [tipoCuenta, setTipoCuenta] = useState('empresa');
    const [nombreComercial, setNombreComercial] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!acceptTerms) {
            setError('Debes aceptar los términos y condiciones');
            return;
        }

        setIsLoading(true);

        try {
            await signUpWithEmail(email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            const error = err as { code?: string };
            if (error.code === 'auth/email-already-in-use') {
                setError('Este correo ya está registrado');
            } else if (error.code === 'auth/weak-password') {
                setError('La contraseña es muy débil');
            } else {
                setError('Error al crear la cuenta. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError('');
        setIsGoogleLoading(true);

        try {
            await signInWithGoogle();
            router.push('/dashboard');
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            console.error('Google SignUp Error:', error);
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                // User closed the popup, not an error
            } else if (error.code === 'auth/unauthorized-domain') {
                setError('Dominio no autorizado en Firebase. Añade este dominio en Firebase Console -> Authentication -> Settings -> Authorized domains.');
            } else if (error.code === 'auth/operation-not-allowed') {
                setError('El registro con Google no está habilitado en Firebase Console -> Authentication -> Sign-in method.');
            } else if (error.code === 'auth/popup-blocked') {
                setError('El navegador bloqueó la ventana emergente (popup). Por favor, permite ventanas emergentes para este sitio.');
            } else {
                setError(`Error al registrarse con Google (${error.code || error.message || 'Error desconocido'}).`);
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const getAccountTypeLabel = () => {
        switch (tipoCuenta) {
            case 'empresa':
                return 'Empresa / Sociedad Anónima';
            case 'natural':
                return 'Persona Natural';
            case 'profesional':
                return 'Profesional / Independiente';
            default:
                return 'Selecciona tipo de cuenta';
        }
    };

    return (
        <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground">Crear Cuenta</h2>
                <p className="mt-2 text-sm text-gray-500">
                    Configura tu perfil empresarial gratis.
                </p>
            </div>

            {error && (
                <Alert variant="error">{error}</Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tipo de cuenta - Only render after hydration */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Tipo de Cuenta
                    </label>
                    {mounted ? (
                        <Select value={tipoCuenta} onValueChange={setTipoCuenta}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona tipo de cuenta">
                                    {getAccountTypeLabel()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="empresa">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>Empresa / Sociedad Anónima</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="natural">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>Persona Natural</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="profesional">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>Profesional / Independiente</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            Empresa / Sociedad Anónima
                        </div>
                    )}
                </div>

                {/* Nombre Comercial */}
                <div>
                    <label htmlFor="nombreComercial" className="block text-sm font-medium text-foreground">
                        Nombre Comercial / Razón Social
                    </label>
                    <Input
                        id="nombreComercial"
                        type="text"
                        placeholder="Juan Pérez / Mi Empresa S.A."
                        value={nombreComercial}
                        onChange={(e) => setNombreComercial(e.target.value)}
                        required
                        className="mt-1"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Correo Electrónico
                    </label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="ejemplo@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1"
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                        Contraseña
                    </label>
                    <div className="relative mt-1">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                        Confirmar Contraseña
                    </label>
                    <div className="relative mt-1">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 cursor-pointer"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-gray-600">
                        Acepto los{' '}
                        <Link href="/terms" className="text-primary hover:underline">
                            términos
                        </Link>{' '}
                        y la{' '}
                        <Link href="/privacy" className="text-primary hover:underline">
                            política de privacidad
                        </Link>
                        .
                    </span>
                </label>

                {/* Submit button */}
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creando cuenta...' : 'Registrarse'}
                </Button>
            </form>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">o</span>
                </div>
            </div>

            {/* Google Sign Up - Now below the form */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
            >
                {isGoogleLoading ? (
                    <span>Conectando...</span>
                ) : (
                    <>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continuar con Google
                    </>
                )}
            </Button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Inicia Sesión
                </Link>
            </p>
        </div>
    );
}
