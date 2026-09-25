import { Skeleton } from '@/components/ui/skeleton';

export function TeamSettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando equipe" className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex justify-between gap-5">
          <div className="flex-1">
            <Skeleton className="h-6 w-40 motion-reduce:animate-none" />
            <Skeleton className="mt-3 h-4 w-72 max-w-full motion-reduce:animate-none" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl motion-reduce:animate-none" />
        </div>
        <Skeleton className="mt-6 h-2 w-full rounded-full motion-reduce:animate-none" />
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <Skeleton className="h-6 w-32 motion-reduce:animate-none" />
          <Skeleton className="mt-2 h-4 w-56 motion-reduce:animate-none" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-5 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full motion-reduce:animate-none" />
                <div>
                  <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-3 w-24 motion-reduce:animate-none" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-lg motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <Skeleton className="h-6 w-28 motion-reduce:animate-none" />
          <Skeleton className="mt-2 h-4 w-64 motion-reduce:animate-none" />
        </div>
        <div className="space-y-4 p-6">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl motion-reduce:animate-none" />
          ))}
        </div>
      </section>
    </div>
  );
}
