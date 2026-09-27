import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando visão geral" className="mx-auto max-w-7xl">
      <span role="status" className="sr-only">
        Organizando sua visão geral...
      </span>

      <div aria-hidden="true">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-10 w-56 motion-reduce:animate-none" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full motion-reduce:animate-none" />
          </div>

          <Skeleton className="h-12 w-40 rounded-xl motion-reduce:animate-none" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Skeleton className="size-12 rounded-full motion-reduce:animate-none" />

                <div className="flex-1">
                  <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
                  <Skeleton className="mt-3 h-7 w-32 motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-4 w-40 max-w-full motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <Skeleton className="h-6 w-64 max-w-full motion-reduce:animate-none" />
              <Skeleton className="mt-2 h-4 w-80 max-w-full motion-reduce:animate-none" />
            </div>

            <div className="hidden sm:block">
              <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
              <Skeleton className="mt-2 h-6 w-32 motion-reduce:animate-none" />
            </div>
          </div>

          <Skeleton className="mt-8 h-64 rounded-xl motion-reduce:animate-none" />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <Skeleton className="h-80 rounded-2xl motion-reduce:animate-none" />
          <Skeleton className="h-80 rounded-2xl motion-reduce:animate-none" />
        </div>

        <Skeleton className="mt-5 h-64 rounded-2xl motion-reduce:animate-none" />
      </div>
    </div>
  );
}
