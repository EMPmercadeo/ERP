'use client';

import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { getCurrentUser, setSessionToken, deleteSessionEmail, getUserRole } from '@/lib/actions/auth';
import {
    User,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile as firebaseUpdateProfile,
    sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    role: string | null;
    error: string | null;
    clearError: () => void;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
    isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const initializedRef = useRef(false);

    const clearError = () => setAuthError(null);

    // Stable mock user – created once, never triggers re-renders
    const mockUserRef = useRef<User | null>((process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_FALLBACK === 'true') ? {
        uid: 'force-admin-xyz',
        email: 'empsignature@gmail.com',
        emailVerified: true,
        displayName: 'Forced Admin',
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => { },
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({ token: 'mock', claims: {} } as unknown as Awaited<ReturnType<User['getIdTokenResult']>>),
        reload: async () => { },
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'password',
    } as unknown as User : null);

    const refreshUser = useCallback(async () => {
        const currentUser = user || mockUserRef.current;
        if (!currentUser?.email) return;

        try {
            const dbUser = await getCurrentUser(currentUser.email);
            if (dbUser) {
                if (auth.currentUser) {
                    await firebaseUpdateProfile(auth.currentUser, { displayName: dbUser.nombre });
                    await auth.currentUser.reload();
                    setUser({ ...auth.currentUser });
                }
                if (mockUserRef.current && !auth.currentUser) {
                    mockUserRef.current = {
                        ...mockUserRef.current,
                        displayName: dbUser.nombre
                    } as User;
                    setUser({ ...mockUserRef.current });
                }
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    }, [user]);

    // Single initialization effect – runs ONCE
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const initAuth = async () => {
            if (process.env.NODE_ENV === 'development') {
                // Sync mock user session on mount
                const mock = mockUserRef.current;
                if (mock?.email) {
                    // Modo mock (ALLOW_DEV_FALLBACK): no existe un ID Token real de Firebase que verificar.
                    // getTenantContext() ya reconoce este caso vía NODE_ENV+ALLOW_DEV_FALLBACK sin depender de la cookie de sesión.
                    // Fetch role once
                    const r = await getUserRole(mock.email);
                    setRole(r || null);

                    // Update display name from DB
                    const dbUser = await getCurrentUser(mock.email);
                    if (dbUser?.nombre) {
                        mockUserRef.current = {
                            ...mock,
                            displayName: dbUser.nombre,
                        } as User;
                    }
                    setUser(mockUserRef.current);
                }
            }
            setLoading(false);
        };

        initAuth();

        // Procesar resultado si venimos de una redirección de Google OAuth
        getRedirectResult(auth).then(async (res) => {
            if (res?.user?.email) {
                try {
                    const idToken = await res.user.getIdToken();
                    await setSessionToken(idToken);
                } catch (e) {
                    console.error('Error setting session email in getRedirectResult:', e);
                }
                if (window.location.pathname === '/login' || window.location.pathname === '/register') {
                    window.location.href = '/dashboard';
                }
            }
        }).catch((err) => {
            console.error('Error procesando getRedirectResult de Google:', err);
            // No bloqueamos la UI con setAuthError aquí en el montaje para evitar falsos positivos por bloqueo de cookies de terceros del navegador
        });

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                if (u.email) {
                    try {
                        const idToken = await u.getIdToken();
                        await setSessionToken(idToken);
                    } catch (e) {
                        console.error('Error setting session email in onAuthStateChanged:', e);
                        setAuthError('Error al establecer sesión: ' + (e instanceof Error ? e.message : 'Error desconocido'));
                    }
                    try {
                        const r = await getUserRole(u.email);
                        setRole(r || null);
                        const dbUser = await getCurrentUser(u.email);
                        if (dbUser && dbUser.nombre !== u.displayName) {
                            await firebaseUpdateProfile(u, { displayName: dbUser.nombre });
                        }
                    } catch (dbErr) {
                        console.error('Error syncing details from PostgreSQL, proceeding anyway:', dbErr);
                    }
                }
                setUser(u);
                if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
                    window.location.href = '/dashboard';
                }
            } else {
                // No Firebase user – keep mock
                if (mockUserRef.current?.email) {
                    // Modo mock (ALLOW_DEV_FALLBACK): no existe un ID Token real de Firebase que verificar.
                    // getTenantContext() ya reconoce este caso vía NODE_ENV+ALLOW_DEV_FALLBACK sin depender de la cookie de sesión.
                } else {
                    setUser(null);
                    try {
                        await deleteSessionEmail();
                    } catch (e) {
                        console.error('Error deleting session email:', e);
                    }
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []); // Empty deps – runs once

    const signInWithGoogle = async () => {
        try {
            const res = await signInWithPopup(auth, googleProvider);
            if (res.user?.email) {
                const idToken = await res.user.getIdToken();
                await setSessionToken(idToken);
            }
        } catch (error: unknown) {
            console.error('Error signing in with Google popup, intentando redirección automática:', error);
            const firebaseError = error as { code?: string; message?: string };
            if (firebaseError?.code === 'auth/internal-error' || firebaseError?.code === 'auth/popup-blocked' || firebaseError?.code === 'auth/unauthorized-domain' || firebaseError?.message?.includes('internal')) {
                await signInWithRedirect(auth, googleProvider);
                return new Promise<void>(() => {}); // Bloquear resolución para que el navegador complete la redirección a Google sin ser interrumpido
            }
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await cred.user.getIdToken();
            await setSessionToken(idToken);
        } catch (error: unknown) {
            const firebaseError = error as { code?: string; message?: string };
            if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_FALLBACK === 'true' && (firebaseError.code === 'auth/operation-not-allowed' || firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password')) {
                console.warn('Dev Mode: Bypassing Auth Error', firebaseError.code);

                const dbUser = await getCurrentUser(email);

                const fakeUser = {
                    uid: 'mock-uid-' + Math.random(),
                    email: email,
                    emailVerified: true,
                    isAnonymous: false,
                    metadata: {},
                    providerData: [],
                    refreshToken: '',
                    tenantId: null,
                    delete: async () => { },
                    getIdToken: async () => 'mock-token',
                    getIdTokenResult: async () => ({ token: 'mock', iat: 0, authTime: 0, expirationTime: 0, signInProvider: 'password', signInSecondFactor: null, claims: {} }),
                    reload: async () => { },
                    toJSON: () => ({}),
                    displayName: dbUser?.nombre || 'Dev User',
                    phoneNumber: null,
                    photoURL: null,
                    providerId: 'password',
                } as unknown as User;

                mockUserRef.current = fakeUser;
                setUser(fakeUser);
                // Modo mock (ALLOW_DEV_FALLBACK): no existe un ID Token real de Firebase que verificar.
                // getTenantContext() ya reconoce este caso vía NODE_ENV+ALLOW_DEV_FALLBACK sin depender de la cookie de sesión.

                // Fetch role for this new user
                const r = await getUserRole(email);
                setRole(r || null);
                return;
            }
            console.error('Error signing in with email:', error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string) => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await cred.user.getIdToken();
            await setSessionToken(idToken);
            try {
                await firebaseSendEmailVerification(cred.user);
            } catch (verifyError) {
                // No bloqueamos el registro si falla el envío del correo de verificación
                // (ej. límite de envíos de Firebase) — el usuario puede reenviarlo luego
                // desde su perfil.
                console.error('Error enviando correo de verificación:', verifyError);
            }
        } catch (error: unknown) {
            console.error('Error signing up:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            mockUserRef.current = null;
            setRole(null);
            await deleteSessionEmail();
        } catch (error: unknown) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        const { sendPasswordResetEmail } = await import('firebase/auth');
        await sendPasswordResetEmail(auth, email);
    };

    const resendVerificationEmail = async () => {
        if (!auth.currentUser) {
            throw new Error('No hay una sesión activa de Firebase.');
        }
        await firebaseSendEmailVerification(auth.currentUser);
    };

    return (
        <AuthContext.Provider value={{
            user: user || mockUserRef.current,
            loading,
            role,
            error: authError,
            clearError,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            signOut,
            resetPassword,
            refreshUser,
            resendVerificationEmail,
            isEmailVerified: (user || mockUserRef.current)?.emailVerified ?? false
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
