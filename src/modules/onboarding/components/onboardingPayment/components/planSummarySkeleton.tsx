import { Skeleton } from '@/components/ui/skeleton';

export function PlanSummarySkeleton() {
  return (
    <div aria-busy="true" className="rounded-2xl border border-border bg-muted/20 p-5">
      <Skeleton className="h-3 w-28 rounded" />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-4 w-full max-w-sm rounded" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="ml-auto h-3 w-14 rounded" />
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-border pt-4">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-4 w-64 max-w-full rounded" />
      </div>
    </div>
  );
}
