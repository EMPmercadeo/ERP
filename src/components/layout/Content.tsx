'use client';

import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentProps {
    children: React.ReactNode;
    className?: string;
}

export function Content({ children, className }: ContentProps) {
    const { isCollapsed } = useSidebarStore();

    return (
        <main
            className={cn(
                'min-h-screen bg-background transition-all duration-300 pb-20 lg:pb-0',
                isCollapsed ? 'lg:pl-16' : 'lg:pl-64',
                className
            )}
        >
            {children}
        </main>
    );
}

interface ContentContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function ContentContainer({ children, className }: ContentContainerProps) {
    return (
        <div className={cn('content-container py-4', className)}>
            {children}
        </div>
    );
}

// Loading state component
export function LoadingState({ message = 'Cargando...' }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <span className="text-muted-foreground">{message}</span>
            </div>
        </div>
    );
}

// Empty state component
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
                {icon || <FileQuestion className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="mb-1 text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick}>{action.label}</Button>
            )}
        </div>
    );
}

// Error state component
interface ErrorStateProps {
    title?: string;
    message: string;
    retry?: () => void;
}

export function ErrorState({ title = 'Error', message, retry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">{title}</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">{message}</p>
            {retry && (
                <Button variant="outline" onClick={retry}>
                    Reintentar
                </Button>
            )}
        </div>
    );
}

// Page skeleton for initial loading
export function PageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>

            {/* Table skeleton */}
            <Skeleton className="h-64 rounded-xl" />
        </div>
    );
}
