import { Skeleton } from '@/components/ui/skeleton';
import { ScheduleCalendarSkeleton, ScheduleSummarySkeleton } from '@/modules/schedule/components/scheduleSkeleton';

export default function ScheduleLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      <div aria-hidden="true">
        <Skeleton className="h-10 w-56 motion-reduce:animate-none" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full motion-reduce:animate-none" />

        <div className="mt-8">
          <ScheduleSummarySkeleton />
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-9 w-56 motion-reduce:animate-none" />
              <Skeleton className="h-9 w-28 motion-reduce:animate-none" />
            </div>

            <div className="mt-5 grid gap-3 border-t border-border pt-5 lg:grid-cols-4">
              <Skeleton className="h-11 rounded-xl motion-reduce:animate-none" />
              <Skeleton className="h-11 rounded-xl motion-reduce:animate-none" />
              <Skeleton className="h-11 rounded-xl motion-reduce:animate-none" />
              <Skeleton className="h-11 rounded-xl motion-reduce:animate-none" />
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <ScheduleCalendarSkeleton />
          </div>
        </section>
      </div>
    </div>
  );
}
