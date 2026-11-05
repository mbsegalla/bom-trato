import { Skeleton } from '@/components/ui/skeleton';

export function AutomationSettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando automações" className="space-y-6">
      <span role="status" className="sr-only">
        Carregando automações...
      </span>

      <section aria-hidden="true" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl motion-reduce:animate-none" />

          <div className="flex-1">
            <Skeleton className="h-6 w-44 motion-reduce:animate-none" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full motion-reduce:animate-none" />
          </div>
        </div>

        <div className="mt-6 divide-y divide-border">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-start justify-between gap-5 py-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Skeleton className="mt-0.5 size-9 shrink-0 rounded-xl motion-reduce:animate-none" />

                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-64 max-w-full motion-reduce:animate-none" />
                  <Skeleton className="mt-3 h-3 w-full max-w-2xl motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-3 w-4/5 max-w-xl motion-reduce:animate-none" />
                </div>
              </div>

              <Skeleton className="mt-1 h-6 w-11 shrink-0 rounded-full motion-reduce:animate-none" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-6 ml-auto h-11 w-40 rounded-xl motion-reduce:animate-none" />
      </section>

      <section aria-hidden="true" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-md motion-reduce:animate-none" />
          <Skeleton className="h-6 w-52 motion-reduce:animate-none" />
        </div>

        <div className="mt-5 divide-y divide-border">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-start gap-4 py-4">
              <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full motion-reduce:animate-none" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-72 max-w-full motion-reduce:animate-none" />
                  <Skeleton className="h-3 w-16 shrink-0 motion-reduce:animate-none" />
                </div>

                <Skeleton className="mt-3 h-3 w-28 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
