import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
    return (
        <div className="space-y-4">
            <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6">
                <Skeleton className="h-6 w-40" />
                <div className="flex-1" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="content-container py-4 space-y-6">
                <div className="border rounded-xl bg-card p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-2/3" />
                </div>
            </div>
        </div>
    );
}
