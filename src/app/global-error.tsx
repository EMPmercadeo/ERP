'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[GlobalError]', error);
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
                        {error?.digest && (
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
                            <a
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
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
