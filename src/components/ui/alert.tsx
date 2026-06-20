import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
    "relative w-full rounded-lg border p-4 text-sm flex gap-3",
    {
        variants: {
            variant: {
                error: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
                success: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
                warning: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
                info: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
                neutral: "bg-muted text-foreground border-border",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    }
)

const iconMap = {
    error: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
    neutral: Info,
}

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
    title?: string
    icon?: React.ReactNode
    dismissible?: boolean
    onDismiss?: () => void
}

function Alert({
    className,
    variant = "neutral",
    title,
    icon,
    dismissible,
    onDismiss,
    children,
    ...props
}: AlertProps) {
    const IconComponent = iconMap[variant || "neutral"]
    const displayIcon = icon !== undefined ? icon : <IconComponent className="h-5 w-5 shrink-0 mt-0.5" />

    return (
        <div
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        >
            {displayIcon}
            <div className="flex-1 space-y-1">
                {title && (
                    <AlertTitle>{title}</AlertTitle>
                )}
                {children && (
                    <AlertDescription>{children}</AlertDescription>
                )}
            </div>
            {dismissible && (
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Cerrar"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h5
            className={cn("font-medium leading-none", className)}
            {...props}
        />
    )
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <div
            className={cn("text-sm opacity-90", className)}
            {...props}
        />
    )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
