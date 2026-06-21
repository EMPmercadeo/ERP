import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-4 p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-10 w-48" />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="border rounded-xl p-6 bg-card space-y-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-8 w-36" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Table + Status Card */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <div className="border rounded-xl bg-card p-6 space-y-3">
                        <Skeleton className="h-6 w-48 mb-4" />
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <div className="border rounded-xl bg-card p-6 space-y-3">
                        <Skeleton className="h-6 w-36 mb-4" />
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
