import * as React from "react"

import { cn } from "@/lib/utils"

// Design System v2:
// - se quita `py-6 gap-6` del root: inyectaba 24px de aire sobre cada cabecera de panel
//   y otros 24px entre el divisor y el contenido. Ahora cada slot trae su propio padding.
// - radio 8px (máximo del sistema) y elevación de un solo nivel: borde 1px + sombra 2px
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col rounded-lg border border-border shadow-[0_1px_2px_rgba(16,26,43,0.04)]",
        className
      )}
      {...props}
    />
  )
}

// Cabecera de panel: 14px/600, divisor suave, padding 14px 18px
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header flex items-start justify-between gap-3 px-[18px] py-3.5 border-b border-border-soft",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-sm font-semibold leading-none tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-xs mt-0.5", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("shrink-0 self-start", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-[18px] py-4", className)}
      {...props}
    />
  )
}

// Pie integrado (paginación, resumen): fondo sutil + borde superior
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between px-4 py-2.5 bg-surface-subtle border-t border-border",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
