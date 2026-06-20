import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormFieldProps {
    label: string
    required?: boolean
    error?: string | string[]
    hint?: string
    className?: string
    children: React.ReactNode
    htmlFor?: string
}

function FormField({
    label,
    required = false,
    error,
    hint,
    className,
    children,
    htmlFor,
}: FormFieldProps) {
    const errorMessage = Array.isArray(error) ? error[0] : error
    const hasError = !!errorMessage

    return (
        <div className={cn("space-y-1.5", className)}>
            <label
                htmlFor={htmlFor}
                className="block text-sm font-medium text-foreground"
            >
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>
            {children}
            {hasError && (
                <p className="text-xs text-destructive mt-1">{errorMessage}</p>
            )}
            {!hasError && hint && (
                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            )}
        </div>
    )
}

// Compound component for inline label+input on same row
function FormFieldRow({
    label,
    required = false,
    error,
    hint,
    className,
    children,
    htmlFor,
}: FormFieldProps) {
    const errorMessage = Array.isArray(error) ? error[0] : error
    const hasError = !!errorMessage

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center gap-4">
                <label
                    htmlFor={htmlFor}
                    className="text-sm font-medium text-foreground min-w-[120px]"
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
                <div className="flex-1">{children}</div>
            </div>
            {hasError && (
                <p className="text-xs text-destructive ml-[136px]">{errorMessage}</p>
            )}
            {!hasError && hint && (
                <p className="text-xs text-muted-foreground ml-[136px]">{hint}</p>
            )}
        </div>
    )
}

export { FormField, FormFieldRow }
