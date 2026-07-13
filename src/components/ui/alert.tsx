import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
    "relative w-full rounded-lg border p-4 text-sm flex gap-3",
    {
        variants: {
            variant: {
                error: "bg-danger-bg text-danger border-danger/30",
                success: "bg-success-bg text-success border-success/30",
                warning: "bg-warning-bg text-warning border-warning/30",
                info: "bg-info-bg text-info border-info/30",
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
