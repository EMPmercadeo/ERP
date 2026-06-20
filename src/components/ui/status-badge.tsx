import * as React from "react"
import { Badge, badgeVariants } from "./badge"
import { CheckCircle2, Clock, XCircle, AlertCircle, Ban, Loader2, FileEdit, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"

// DGI Invoice statuses
type DgiStatus = "aceptada" | "pendiente" | "rechazada" | "procesando" | "anulada" | "borrador"

// Payment statuses
type PaymentStatus = "pagada" | "pendiente" | "parcial" | "vencida"

// Combined status type
type Status = DgiStatus | PaymentStatus

const statusConfig: Record<string, {
    label: string
    variant: VariantProps<typeof badgeVariants>["variant"]
    icon: React.ElementType
}> = {
    // DGI statuses
    aceptada: {
        label: "Aceptada",
        variant: "success",
        icon: CheckCircle2,
    },
    pendiente: {
        label: "Pendiente",
        variant: "warning",
        icon: Clock,
    },
    rechazada: {
        label: "Rechazada",
        variant: "destructive",
        icon: XCircle,
    },
    procesando: {
        label: "Procesando",
        variant: "info",
        icon: Loader2,
    },
    anulada: {
        label: "Anulada",
        variant: "neutral",
        icon: Ban,
    },
    borrador: {
        label: "Borrador",
        variant: "neutral",
        icon: FileEdit,
    },
    // Payment statuses
    pagada: {
        label: "Pagada",
        variant: "success",
        icon: CheckCircle2,
    },
    parcial: {
        label: "Pago Parcial",
        variant: "warning",
        icon: AlertCircle,
    },
    vencida: {
        label: "Vencida",
        variant: "destructive",
        icon: AlertCircle,
    },
}

// Fallback for unknown statuses
const fallbackConfig = {
    label: "Desconocido",
    variant: "neutral" as const,
    icon: HelpCircle,
}

export interface StatusBadgeProps extends Omit<React.ComponentProps<typeof Badge>, "variant"> {
    status: Status | string
    showIcon?: boolean
}

function StatusBadge({
    status,
    showIcon = true,
    className,
    ...props
}: StatusBadgeProps) {
    const config = statusConfig[status] || fallbackConfig
    const Icon = config.icon

    return (
        <Badge
            variant={config.variant}
            className={cn(className)}
            {...props}
        >
            {showIcon && (
                <Icon className={cn("h-3 w-3", status === "procesando" && "animate-spin")} />
            )}
            {config.label}
        </Badge>
    )
}

export { StatusBadge, statusConfig }
export type { Status, DgiStatus, PaymentStatus }

