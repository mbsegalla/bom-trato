import { Skeleton } from '@/components/ui/skeleton';

export function PricingSectionSkeleton() {
  return (
    <section id="pricing" aria-label="Planos" aria-busy="true" className="scroll-mt-24 px-6 py-20 sm:py-28 lg:px-10">
      <span role="status" className="sr-only">
        Carregando planos...
      </span>

      <div aria-hidden="true" className="mx-auto max-w-7xl">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <Skeleton className="h-4 w-16 motion-reduce:animate-none" />
          <Skeleton className="mt-3 h-10 w-full max-w-md motion-reduce:animate-none" />
          <Skeleton className="mt-4 h-5 w-full max-w-sm motion-reduce:animate-none" />
          <Skeleton className="mt-8 h-12 w-48 rounded-xl motion-reduce:animate-none" />
          <Skeleton className="mt-4 h-4 w-full max-w-xs motion-reduce:animate-none" />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex flex-col rounded-3xl border bg-card p-7 sm:p-8">
              <div className="min-h-7">
                <Skeleton className="h-6 w-40 rounded-full motion-reduce:animate-none" />
              </div>

              <Skeleton className="mt-5 h-7 w-48 max-w-full motion-reduce:animate-none" />

              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full motion-reduce:animate-none" />
                <Skeleton className="h-4 w-5/6 motion-reduce:animate-none" />
                <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
              </div>

              <Skeleton className="mt-7 h-10 w-44 motion-reduce:animate-none" />

              <div className="my-8 space-y-3">
                {Array.from({ length: 4 }, (_, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <Skeleton className="size-4 shrink-0 rounded-full motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
                  </div>
                ))}
              </div>

              <Skeleton className="mt-auto h-12 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
