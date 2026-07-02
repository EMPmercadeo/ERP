'use client';

import { useEffect } from 'react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[AdminLayout Error]', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-red-900 shadow-sm max-w-lg w-full text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-xl font-bold mb-3">Error en el Panel de Administración</h2>
                <p className="text-sm text-red-700 mb-2">
                    No se pudo cargar el panel de administración. Esto puede deberse a un problema de autenticación o conexión.
                </p>
                {error?.digest && (
                    <p className="text-xs text-red-500 mb-4">
                        Código: <code className="bg-red-100 px-1 py-0.5 rounded">{error.digest}</code>
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        Reintentar
                    </button>
                    <a
                        href="/login"
                        className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                        Iniciar Sesión
                    </a>
                </div>
            </div>
        </div>
    );
}
