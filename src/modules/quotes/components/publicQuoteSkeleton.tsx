import { Skeleton } from '@/components/ui/skeleton';

export function PublicQuoteSkeleton() {
  return (
    <main aria-busy="true" aria-label="Carregando orçamento" className="min-h-dvh bg-background px-5 py-8 sm:py-12">
      <span role="status" className="sr-only">
        Carregando orçamento...
      </span>

      <div aria-hidden="true" className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-6 w-32 motion-reduce:animate-none" />
          </div>

          <Skeleton className="h-7 w-20 rounded-full motion-reduce:animate-none" />
        </header>

        <article className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6 sm:p-8">
            <Skeleton className="h-3 w-32 motion-reduce:animate-none" />
            <Skeleton className="mt-4 h-9 w-72 max-w-full motion-reduce:animate-none" />
            <Skeleton className="mt-4 h-4 w-56 motion-reduce:animate-none" />
            <Skeleton className="mt-2 h-4 w-44 motion-reduce:animate-none" />
          </div>

          <div className="p-6 sm:p-8">
            <div className="space-y-3 rounded-2xl border border-border p-5">
              <div className="flex justify-between gap-5">
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-3 w-56 motion-reduce:animate-none" />
                  <Skeleton className="mt-3 h-3 w-4/5 motion-reduce:animate-none" />
                </div>

                <Skeleton className="h-5 w-24 motion-reduce:animate-none" />
              </div>
            </div>

            <div className="mt-6 ml-auto max-w-sm space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex justify-between gap-6">
                  <Skeleton className="h-4 w-20 motion-reduce:animate-none" />
                  <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
                </div>
              ))}
            </div>

            <Skeleton className="mt-8 h-24 w-full rounded-2xl motion-reduce:animate-none" />

            <div className="mt-8 flex justify-between gap-3">
              <Skeleton className="h-11 w-32 rounded-lg motion-reduce:animate-none" />

              <div className="flex gap-2">
                <Skeleton className="h-11 w-36 rounded-lg motion-reduce:animate-none" />
                <Skeleton className="h-11 w-36 rounded-lg motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
