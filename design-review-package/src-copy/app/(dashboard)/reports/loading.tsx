import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
    return (
        <div className="space-y-4">
            <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6">
                <Skeleton className="h-6 w-32" />
                <div className="flex-1" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="content-container py-4 space-y-6">
                {/* KPI Row */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="border rounded-xl p-6 bg-card space-y-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-8 w-36" />
                        </div>
                    ))}
                </div>
                {/* Charts */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="border rounded-xl bg-card p-6">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="border rounded-xl bg-card p-6">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
