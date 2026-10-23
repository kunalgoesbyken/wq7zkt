import { Skeleton } from "@/components/ui/skeleton";

export function AccuracyReportSkeleton() {
  return (
    <div className="flex flex-col gap-14" aria-hidden>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-sm" />
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export function AccuracyViewSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-96" />
        </div>
      </div>
      <div className="border-t pt-10">
        <AccuracyReportSkeleton />
      </div>
    </div>
  );
}
