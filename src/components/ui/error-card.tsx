import Link from 'next/link';

interface ErrorCardProps {
    title: string;
    description: string;
    digest?: string;
    reset: () => void;
    actionHref?: string;
    actionLabel?: string;
    minHeight?: string;
    icon?: string;
}

export function ErrorCard({
    title,
    description,
    digest,
    reset,
    actionHref = '/',
    actionLabel = 'Ir al Inicio',
    minHeight = 'min-h-[60vh]',
    icon = '⚠️',
}: ErrorCardProps) {
    return (
        <div className={`flex items-center justify-center ${minHeight} px-4`}>
            <div className="rounded-lg border border-danger/30 bg-danger-bg p-8 text-danger shadow-sm max-w-lg w-full text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h2 className="text-xl font-bold mb-3">{title}</h2>
                <p className="text-sm text-danger mb-2">{description}</p>
                {digest && (
                    <p className="text-xs text-danger/80 mb-4">
                        Código de error: <code className="bg-danger-bg/80 px-1 py-0.5 rounded">{digest}</code>
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                        type="button"
                        onClick={reset}
                        className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 transition-colors text-sm font-medium"
                    >
                        Reintentar
                    </button>
                    <Link
                        href={actionHref}
                        className="px-4 py-2 bg-card border border-danger/40 text-danger rounded-md hover:bg-danger-bg transition-colors text-sm font-medium"
                    >
                        {actionLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}
