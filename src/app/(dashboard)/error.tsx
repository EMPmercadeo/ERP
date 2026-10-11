'use client';

import { useEffect } from 'react';
import { ErrorCard } from "@/components/ui/error-card";

function logClientError(payload: Record<string, unknown>) {
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
}

export default function DashboardError({
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

        logClientError(payload);
    }, [error]);

    return (
        <ErrorCard
            title="Error al cargar la página"
            description="Ocurrió un error inesperado al cargar esta sección del panel."
            digest={error?.digest}
            reset={reset}
            actionHref="/"
            actionLabel="Ir al Inicio"
        />
    );
}
