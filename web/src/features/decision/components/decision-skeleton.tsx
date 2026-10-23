import { Skeleton } from "@/components/ui/skeleton";

export function DecisionDaySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="grid gap-8 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:grid-cols-12 lg:p-7">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-full max-w-sm" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:col-span-7">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export function DecisionDeskSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-80" />
      </div>
      <DecisionDaySkeleton />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
