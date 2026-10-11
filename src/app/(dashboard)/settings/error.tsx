'use client';

import { useEffect } from 'react';
import { ErrorCard } from "@/components/ui/error-card";

export default function SettingsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[SettingsPage Error]', error);
    }, [error]);

    return (
        <ErrorCard
            title="Error al cargar Configuración"
            description="Ocurrió un error inesperado al cargar la página de configuración."
            digest={error?.digest}
            reset={reset}
            actionHref="/"
            actionLabel="Ir al Inicio"
        />
    );
}
