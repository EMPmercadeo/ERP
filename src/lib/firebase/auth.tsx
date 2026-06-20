'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { getCurrentUser, setSessionEmail, deleteSessionEmail } from '@/lib/actions/auth';
import {
    User,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [mockUser, setMockUser] = useState<User | null>({
        // ... previous mock user ...
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
        getIdTokenResult: async () => ({ token: 'mock', claims: {} } as any),
        reload: async () => { },
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'password',
    } as unknown as User);

    const refreshUser = async () => {
        const currentUser = user || mockUser;
        if (!currentUser?.email) return;

        try {
            const dbUser = await getCurrentUser(currentUser.email);
            if (dbUser) {
                // Update Firebase User if exists
                if (auth.currentUser) {
                    await firebaseUpdateProfile(auth.currentUser, { displayName: dbUser.nombre });
                    // Force reload to get new object
                    await auth.currentUser.reload();
                    setUser({ ...auth.currentUser });
                }

                // Update Mock User if active
                if (mockUser) {
                    const updated = { ...mockUser, displayName: dbUser.nombre };
                    setMockUser(updated as User);
                    localStorage.setItem('mockUser', JSON.stringify(updated));
                    // If user is currently mockUser, we need to update 'user' state too if it mirrors mock
                    if (user === mockUser) {
                        setUser(updated as User);
                    }
                }
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    useEffect(() => {
        const syncOnMount = async () => {
            const currentUser = auth.currentUser || mockUser;
            if (currentUser?.email) {
                await setSessionEmail(currentUser.email);
            } else {
                await deleteSessionEmail();
            }
        };
        syncOnMount();

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                // Determine if we need to sync name
                const dbUser = await getCurrentUser(u.email);
                if (dbUser && dbUser.nombre !== u.displayName) {
                    await firebaseUpdateProfile(u, { displayName: dbUser.nombre });
                }
                setUser(u);
                if (u.email) {
                    await setSessionEmail(u.email);
                }
            } else {
                setUser(null);
                if (mockUser?.email) {
                    await setSessionEmail(mockUser.email);
                } else {
                    await deleteSessionEmail();
                }
            }
            setLoading(false);
        });

        // Initial refresh for mock/stored
        refreshUser();

        return () => unsubscribe();
    }, [mockUser]);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: unknown) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            await setSessionEmail(email);
        } catch (error: any) {
            if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                console.warn('Dev Mode: Bypassing Auth Error', error.code);

                // Fetch real name from DB if possible
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
                    displayName: dbUser?.nombre || 'Dev User', // Use DB name
                    phoneNumber: null,
                    photoURL: null,
                    providerId: 'password',
                } as unknown as User;

                setMockUser(fakeUser);
                localStorage.setItem('mockUser', JSON.stringify(fakeUser));
                await setSessionEmail(email);
                return;
            }
            console.error('Error signing in with email:', error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error('Error signing up:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setMockUser(null);
            localStorage.removeItem('mockUser');
            await deleteSessionEmail();
        } catch (error: unknown) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user: user || mockUser,
            loading,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            signOut,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// ... useAuth

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
