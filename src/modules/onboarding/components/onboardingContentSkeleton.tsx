import { Skeleton } from '@/components/ui/skeleton';

export function OnboardingContentSkeleton() {
  return (
    <div aria-busy="true" aria-label="Preparando próximo passo" className="mx-auto max-w-3xl">
      <span role="status" className="sr-only">
        Preparando seu próximo passo...
      </span>

      <div aria-hidden="true">
        <header className="mb-10">
          <Skeleton className="h-3 w-44 motion-reduce:animate-none" />

          <div className="mt-5 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index}>
                <Skeleton className="h-0.5 w-full motion-reduce:animate-none" />
                <Skeleton className="mt-3 h-3 w-20 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </header>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Skeleton className="size-14 rounded-2xl motion-reduce:animate-none" />

          <Skeleton className="mt-6 h-9 w-72 max-w-full motion-reduce:animate-none" />
          <Skeleton className="mt-4 h-4 w-full motion-reduce:animate-none" />
          <Skeleton className="mt-2 h-4 w-4/5 motion-reduce:animate-none" />

          <div className="mt-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-12 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-12 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        </section>
      </div>
    </div>
  );
}
