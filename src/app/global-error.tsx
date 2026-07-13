'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Centralized Client Error Logging
        const incidentId = 'inc_' + Math.random().toString(36).substring(2, 15);
        const payload = {
            digest: error?.digest || undefined,
            incidentId,
            ruta: typeof window !== 'undefined' ? window.location.pathname : 'server-side',
            timestamp: new Date().toISOString(),
            versionDespliegue: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
        };

        // Report to centralized endpoint
        fetch('/api/client-errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }).catch(err => {
            // Silently fail if logging endpoint is down to avoid infinite loop
            console.error('Failed to dispatch error report:', err);
        });
    }, [error]);

    return (
        <html lang="es">
            <body>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                    <div style={{
                        borderRadius: '12px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        padding: '32px',
                        color: '#7f1d1d',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        maxWidth: '480px',
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
                            Error del Sistema
                        </h2>
                        <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '8px' }}>
                            Ocurrió un error inesperado. Esto puede deberse a un problema temporal de conexión.
                        </p>
                        {process.env.NODE_ENV === 'development' && error?.digest && (
                            <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '16px' }}>
                                Código: <code style={{
                                    backgroundColor: '#fee2e2',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                }}>{error.digest}</code>
                            </p>
                        )}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            marginTop: '16px',
                            alignItems: 'center',
                        }}>
                            <button
                                onClick={() => reset()}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                }}
                            >
                                Reintentar
                            </button>
                            <Link
                                href="/"
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'white',
                                    border: '1px solid #fca5a5',
                                    color: '#b91c1c',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                }}
                            >
                                Ir al Inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
