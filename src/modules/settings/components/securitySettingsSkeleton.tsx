import { Skeleton } from '@/components/ui/skeleton';

export function SecuritySettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando segurança da conta" className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <Skeleton className="h-6 w-40 motion-reduce:animate-none" />

          <Skeleton className="mt-2 h-4 w-80 max-w-full motion-reduce:animate-none" />
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-5 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <Skeleton className="size-11 shrink-0 rounded-xl motion-reduce:animate-none" />

                <div>
                  <Skeleton className="h-4 w-44 motion-reduce:animate-none" />

                  <Skeleton className="mt-2 h-3 w-64 max-w-full motion-reduce:animate-none" />
                </div>
              </div>

              <Skeleton className="h-9 w-24 rounded-lg motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-52 motion-reduce:animate-none" />

        <Skeleton className="mt-2 h-4 w-96 max-w-full motion-reduce:animate-none" />

        <Skeleton className="mt-6 h-10 w-48 rounded-lg motion-reduce:animate-none" />
      </section>
    </div>
  );
}
