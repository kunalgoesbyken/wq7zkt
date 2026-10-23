import { Skeleton } from "@/components/ui/skeleton";

export function DecisionDaySkeleton() {
  return (
    <div className="flex flex-col gap-14" aria-hidden>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-8 w-full max-w-lg" />
        <Skeleton className="h-8 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-3xl" />
        <Skeleton className="mt-4 h-4 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export function DecisionDeskSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-80" />
        </div>
      </div>
      <div className="border-t pt-10">
        <DecisionDaySkeleton />
      </div>
    </div>
  );
}
