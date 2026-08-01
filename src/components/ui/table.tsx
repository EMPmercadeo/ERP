"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Design System v2 §7 — la densidad de tabla vive aquí, en la primitiva, no en cada lista.
//
// Antes cada componente (InvoiceList, ClientList, RecentActivityTable, y las tablas de
// insumos) repetía sus propias clases de alto y tipografía en cada `TableHead`. El
// resultado era que ninguna tabla del sistema medía igual que otra. Ahora el valor por
// defecto ya es el correcto y las listas solo declaran alineación y ancho.
//
// - cabecera 32px, `.label-caps`, sobre Superficie Sutil
// - filas de 44px separadas por el borde suave (dentro de un bloque), no por el normal
// - `whitespace-nowrap` se mantiene: en una tabla financiera es peor que una cifra se
//   parta en dos líneas que tener scroll horizontal

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-[13px]", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-surface-subtle [&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-surface-subtle border-t border-border font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-11 border-b border-border-soft transition-colors hover:bg-surface-light data-[state=selected]:bg-accent",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "label-caps h-8 px-3 text-left align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Celda numérica: mono tabular y alineada a la derecha. Es la Regla del Mono para Datos
 * hecha componente, para que ninguna lista tenga que acordarse de las tres clases.
 */
function TableCellNumeric({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <TableCell
      data-slot="table-cell-numeric"
      className={cn("text-right font-mono tabular", className)}
      {...props}
    />
  )
}

/** Cabecera de una columna numérica: alineada a la derecha, igual que su celda. */
function TableHeadNumeric({ className, ...props }: React.ComponentProps<"th">) {
  return <TableHead data-slot="table-head-numeric" className={cn("text-right", className)} {...props} />
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-xs", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableHeadNumeric,
  TableRow,
  TableCell,
  TableCellNumeric,
  TableCaption,
}
