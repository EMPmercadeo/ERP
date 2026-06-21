import { Skeleton } from "@/components/ui/skeleton";

export default function ListPageLoading() {
    return (
        <div className="space-y-4">
            <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6">
                <Skeleton className="h-6 w-32" />
                <div className="flex-1" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="content-container py-4 space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-72" />
                    <Skeleton className="h-10 w-28" />
                    <div className="flex-1" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="border rounded-xl bg-card">
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
