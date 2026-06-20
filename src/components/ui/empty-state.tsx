import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { LucideIcon } from "lucide-react"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: LucideIcon
    title: string
    description?: string
    action?: React.ReactNode
}

function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 text-center",
                className
            )}
            {...props}
        >
            {Icon && (
                <div className="rounded-full bg-muted p-4 mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}

export { EmptyState }
