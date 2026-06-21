import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    description?: string
    onRetry?: () => void
    retryLabel?: string
}

function ErrorState({
    title = "Error al cargar",
    description = "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
    onRetry,
    retryLabel = "Reintentar",
    className,
    ...props
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 text-center",
                className
            )}
            {...props}
        >
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {description}
            </p>
            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="mt-4"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {retryLabel}
                </Button>
            )}
        </div>
    )
}

export { ErrorState }
