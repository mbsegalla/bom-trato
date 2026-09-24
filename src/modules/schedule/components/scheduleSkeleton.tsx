import { Skeleton } from '@/components/ui/skeleton';

export function ScheduleSummarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando resumo da agenda" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <span role="status" className="sr-only">
        Carregando resumo da agenda...
      </span>

      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} aria-hidden="true" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl motion-reduce:animate-none" />

            <div className="flex-1">
              <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
              <Skeleton className="mt-2 h-7 w-10 motion-reduce:animate-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScheduleCalendarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando agenda">
      <span role="status" className="sr-only">
        Carregando agenda...
      </span>

      <div aria-hidden="true" className="hidden overflow-hidden rounded-2xl border border-border lg:block">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="flex h-11 items-center justify-center px-3">
              <Skeleton className="h-3 w-8 motion-reduce:animate-none" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }, (_, index) => (
            <div key={index} className="min-h-40 border-t border-l border-border p-2">
              <Skeleton className="ml-auto size-7 rounded-full motion-reduce:animate-none" />

              {index % 5 === 1 && <Skeleton className="mt-3 h-12 rounded-xl motion-reduce:animate-none" />}

              {index % 11 === 2 && <Skeleton className="mt-1.5 h-12 rounded-xl motion-reduce:animate-none" />}
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="space-y-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
            <Skeleton className="mt-2 h-3 w-20 motion-reduce:animate-none" />

            <Skeleton className="mt-4 h-24 rounded-xl motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
