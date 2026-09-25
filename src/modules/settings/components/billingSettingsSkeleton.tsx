import { Skeleton } from '@/components/ui/skeleton';

export function BillingSettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando assinatura" className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-40 motion-reduce:animate-none" />
        <Skeleton className="mt-3 h-4 w-64 motion-reduce:animate-none" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl motion-reduce:animate-none" />
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl motion-reduce:animate-none" />
          <Skeleton className="h-10 w-40 rounded-xl motion-reduce:animate-none" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl motion-reduce:animate-none" />
        <Skeleton className="h-56 rounded-2xl motion-reduce:animate-none" />
      </div>

      <Skeleton className="h-80 rounded-2xl motion-reduce:animate-none" />
    </div>
  );
}
