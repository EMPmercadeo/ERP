'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BillingError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[BillingPage Error]', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="rounded-lg border border-danger/30 bg-danger-bg p-8 text-danger shadow-sm max-w-lg w-full text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-3">Error al cargar Facturación</h2>
                <p className="text-sm text-danger mb-2">
                    Ocurrió un error inesperado al cargar la página de facturación.
                </p>
                {error?.digest && (
                    <p className="text-xs text-danger/80 mb-4">
                        Código de error: <code className="bg-danger-bg/80 px-1 py-0.5 rounded">{error.digest}</code>
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 transition-colors text-sm font-medium"
                    >
                        Reintentar
                    </button>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-card border border-danger/40 text-danger rounded-md hover:bg-danger-bg transition-colors text-sm font-medium"
                    >
                        Ir al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
