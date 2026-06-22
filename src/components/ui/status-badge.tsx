import * as React from "react"
import { Badge, badgeVariants } from "./badge"
import { CheckCircle2, Clock, XCircle, AlertCircle, Ban, Loader2, FileEdit, HelpCircle, Send } from "lucide-react"
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
    // Client statuses
    activo: {
        label: "Activo",
        variant: "success",
        icon: CheckCircle2,
    },
    moroso: {
        label: "Moroso",
        variant: "warning",
        icon: Clock,
    },
    bloqueado: {
        label: "Bloqueado",
        variant: "destructive",
        icon: XCircle,
    },
    // Quote statuses
    enviada: {
        label: "Enviada",
        variant: "info",
        icon: Send,
    },
}

const statusClassMap: Record<string, string> = {
    // DGI statuses
    aceptada: "bg-success-bg text-success border-transparent hover:bg-success-bg/90",
    pendiente: "bg-warning-bg text-warning border-transparent hover:bg-warning-bg/90",
    rechazada: "bg-danger-bg text-danger border-transparent hover:bg-danger-bg/90",
    procesando: "bg-info-bg text-info border-transparent hover:bg-info-bg/90",
    anulada: "bg-secondary text-muted-foreground border-border hover:bg-secondary/90",
    borrador: "bg-secondary text-muted-foreground border-border hover:bg-secondary/90",
    // Payment statuses
    pagada: "bg-success-bg text-success border-transparent hover:bg-success-bg/90",
    parcial: "bg-info-bg text-info border-transparent hover:bg-info-bg/90",
    vencida: "bg-danger-bg text-danger border-transparent hover:bg-danger-bg/90",
    // Client statuses
    activo: "bg-success-bg text-success border-transparent hover:bg-success-bg/90",
    moroso: "bg-warning-bg text-warning border-transparent hover:bg-warning-bg/90",
    bloqueado: "bg-danger-bg text-danger border-transparent hover:bg-danger-bg/90",
    // Quote statuses
    enviada: "bg-info-bg text-info border-transparent hover:bg-info-bg/90",
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
    const colorClass = statusClassMap[status] || "bg-secondary text-muted-foreground border-border hover:bg-secondary/90"

    return (
        <Badge
            variant={config.variant}
            className={cn("min-w-[118px] justify-center font-semibold gap-1.5 py-1 px-3 rounded-full text-xs transition-colors", colorClass, className)}
            {...props}
        >
            {showIcon && (
                <Icon className={cn("h-3.5 w-3.5 shrink-0", status === "procesando" && "animate-spin")} />
            )}
            {config.label}
        </Badge>
    )
}

export { StatusBadge, statusConfig }
export type { Status, DgiStatus, PaymentStatus }

