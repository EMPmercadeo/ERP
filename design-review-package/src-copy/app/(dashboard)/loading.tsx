import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            {/* Topbar Skeleton */}
            <div className="flex items-center justify-between border-b pb-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="border rounded-xl p-6 bg-white space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-36" />
                </div>
                <div className="border rounded-xl p-6 bg-white space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-36" />
                </div>
                <div className="border rounded-xl p-6 bg-white space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-36" />
                </div>
            </div>

            {/* Table/List Skeleton */}
            <div className="border rounded-xl bg-white p-6 space-y-4">
                <div className="flex justify-between items-center pb-2">
                    <Skeleton className="h-10 w-72" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
}
