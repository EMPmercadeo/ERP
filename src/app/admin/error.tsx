'use client';

import { useEffect } from 'react';
import { ErrorCard } from "@/components/ui/error-card";

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
        <ErrorCard
            title="Error en el Panel de Administración"
            description="No se pudo cargar el panel de administración. Esto puede deberse a un problema de autenticación o conexión."
            digest={error?.digest}
            reset={reset}
            actionHref="/login"
            actionLabel="Iniciar Sesión"
            minHeight="min-h-screen"
            icon="🔒"
        />
    );
}
