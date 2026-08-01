import * as React from "react"
import { cn } from "@/lib/utils"

// Design System v2 — Status tag (componente de firma)
//
// Cambia respecto a la v1:
// - rectángulo `rounded-sm` (4px) en vez de píldora `rounded-full`
// - alto 20px (h-5), padding 0 8px, 11px/600
// - punto cuadrado de 5px en vez de icono Lucide; se elimina `animate-spin`
// - se elimina `min-w-[118px]`: la columna se alinea porque la celda lo hace,
//   no porque el badge tenga ancho fijo
//
// Motivo: cinco píldoras coloreadas por fila competían con las cifras; el icono era
// redundante con el color y la etiqueta, y el spinner llamaba la atención sobre un
// estado transitorio que el usuario no puede accionar.

type DgiStatus = "aceptada" | "pendiente" | "rechazada" | "procesando" | "anulada" | "borrador" | "local"
type PaymentStatus = "pagada" | "pendiente" | "parcial" | "vencida"
type Status = DgiStatus | PaymentStatus

type Tone = "success" | "warning" | "info" | "danger" | "neutral"

const toneClass: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-secondary text-muted-foreground",
}

// El punto de "advertencia" usa --warning-dot: el ámbar oscuro del texto da contraste AA,
// pero como punto de 5px se lee apagado, así que el punto lleva un tono más vivo.
const dotClass: Partial<Record<Tone, string>> = {
  warning: "bg-warning-dot",
}

const statusConfig: Record<string, { label: string; tone: Tone }> = {
  // DGI
  aceptada: { label: "Aceptada", tone: "success" },
  pendiente: { label: "Pendiente", tone: "warning" },
  rechazada: { label: "Rechazada", tone: "danger" },
  procesando: { label: "Procesando", tone: "info" },
  anulada: { label: "Anulada", tone: "neutral" },
  borrador: { label: "Borrador", tone: "neutral" },
  local: { label: "Local (sin DGI)", tone: "neutral" },
  // Pago
  pagada: { label: "Pagada", tone: "success" },
  parcial: { label: "Parcial", tone: "info" },
  vencida: { label: "Vencida", tone: "danger" },
  // Cliente
  activo: { label: "Activo", tone: "success" },
  moroso: { label: "En mora", tone: "warning" },
  bloqueado: { label: "Bloqueado", tone: "danger" },
  // Cotización
  enviada: { label: "Enviada", tone: "info" },
  // Pedido / entrega
  en_proceso: { label: "En proceso", tone: "info" },
  entregado: { label: "Entregado", tone: "success" },
  parcialmente_entregado: { label: "Parcialmente entregado", tone: "warning" },
  "parcialmente entregado": { label: "Parcialmente entregado", tone: "warning" },
  facturado: { label: "Facturado", tone: "success" },
}

const fallbackConfig = { label: "Desconocido", tone: "neutral" as Tone }

export interface StatusBadgeProps extends React.ComponentProps<"span"> {
  status: Status | string
  /** @deprecated v2 no usa iconos en los tags; se conserva para no romper llamadas existentes. */
  showIcon?: boolean
}

function StatusBadge({ status, showIcon, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status] || fallbackConfig

  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 h-5 px-2 rounded-sm text-[11px] font-semibold leading-none whitespace-nowrap",
        toneClass[config.tone],
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-[5px] rounded-[1px] shrink-0", dotClass[config.tone] || "bg-current")}
      />
      {config.label}
    </span>
  )
}

export { StatusBadge, statusConfig }
export type { Status, DgiStatus, PaymentStatus }
