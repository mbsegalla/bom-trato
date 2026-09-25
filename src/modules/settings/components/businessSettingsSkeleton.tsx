import { Skeleton } from '@/components/ui/skeleton';

export function BusinessSettingsSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Carregando dados do negócio"
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <Skeleton className="h-7 w-48 motion-reduce:animate-none" />

      <Skeleton className="mt-3 h-4 w-80 max-w-full motion-reduce:animate-none" />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />

            <Skeleton className="mt-2 h-12 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-8 ml-auto h-11 w-40 rounded-xl motion-reduce:animate-none" />
    </section>
  );
}
