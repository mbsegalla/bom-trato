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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl motion-reduce:animate-none" />

                <div className="flex-1">
                  <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-7 w-20 motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-80 rounded-2xl motion-reduce:animate-none" />
          <Skeleton className="h-80 rounded-2xl motion-reduce:animate-none" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl motion-reduce:animate-none" />
          <Skeleton className="h-72 rounded-2xl motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
