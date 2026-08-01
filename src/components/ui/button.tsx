import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Design System v2:
// - radio 6px (rounded-md) en vez de 8px
// - altura 32px (h-8) en vez de 36px
// - sin `active:scale-[0.98] active:translate-y-[0.5px]`: en captura rápida (POS,
//   líneas de factura) el rebote se acumula y se lee como lentitud
// - foco de 2px en vez del anillo de 3px
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[12.5px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          // El hover usa el token brand-600, no su valor literal: `npm run lint:colors`
          // prohíbe hardcodear color fuera de globals.css.
          "bg-primary text-primary-foreground border border-primary shadow-[0_1px_2px_rgba(27,107,214,0.25)] hover:bg-brand-600 hover:border-brand-600 font-semibold",
        destructive:
          "bg-destructive text-white border border-destructive hover:brightness-95 focus-visible:ring-destructive/30",
        outline:
          "border border-input bg-card text-foreground hover:bg-background",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-muted",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        // Solo para "Agregar producto / línea" dentro de una tabla editable
        dashed:
          "border border-dashed border-input bg-card text-brand-600 hover:border-primary hover:bg-accent",
        // Acción destructiva de baja jerarquía (Cancelar venta, Eliminar fila)
        subtle:
          "bg-card border border-input text-destructive hover:bg-danger-bg hover:border-destructive/25",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 has-[>svg]:px-2.5",
        sm: "h-7 px-2.5 gap-1 text-[12px]",
        lg: "h-9 px-4 text-[13px]",
        // Solo POS y el CTA de emisión a la DGI
        xl: "h-11 px-5 text-[14px] rounded-lg",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }>(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  })
Button.displayName = "Button"

export { Button, buttonVariants }
