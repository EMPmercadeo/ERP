'use client';

import { useEffect } from 'react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[DashboardError]', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm max-w-lg w-full text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-3">Error al cargar la página</h2>
                <p className="text-sm text-amber-700 mb-2">
                    Ocurrió un error inesperado al cargar esta sección del panel.
                </p>
                {process.env.NODE_ENV === 'development' && error?.digest && (
                    <p className="text-xs text-amber-500 mb-4">
                        Código de error: <code className="bg-amber-100 px-1 py-0.5 rounded">{error.digest}</code>
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
                    >
                        Reintentar
                    </button>
                    <a
                        href="/"
                        className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50 transition-colors text-sm font-medium"
                    >
                        Ir al Inicio
                    </a>
                </div>
            </div>
        </div>
    );
}
