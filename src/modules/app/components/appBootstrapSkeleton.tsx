import { Skeleton } from '@/components/ui/skeleton';

export function AppBootstrapSkeleton() {
  return (
    <div aria-busy="true" aria-label="Preparando seu espaço" className="min-h-dvh bg-background">
      <span role="status" className="sr-only">
        Preparando seu espaço...
      </span>

      <div aria-hidden="true">
        <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <div className="flex min-h-20 items-center gap-2 px-5">
            <Skeleton className="size-10 rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-6 w-32 motion-reduce:animate-none" />
          </div>

          <div className="px-4 pb-5">
            <div className="rounded-2xl border border-sidebar-border bg-background p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl motion-reduce:animate-none" />

                <div className="flex-1">
                  <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-3 w-20 motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 px-4">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="flex min-h-11 items-center gap-3 px-3">
                <Skeleton className="size-5 rounded motion-reduce:animate-none" />
                <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </aside>

        <div className="min-h-dvh lg:pl-72">
          <header className="flex min-h-18 items-center justify-between border-b border-border px-5 sm:px-8 lg:px-10">
            <Skeleton className="h-4 w-44 motion-reduce:animate-none" />

            <div className="flex items-center gap-5">
              <Skeleton className="hidden h-4 w-44 motion-reduce:animate-none md:block" />
              <Skeleton className="size-9 rounded-full motion-reduce:animate-none" />
              <Skeleton className="size-10 rounded-full motion-reduce:animate-none" />
            </div>
          </header>

          <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <Skeleton className="h-10 w-64 motion-reduce:animate-none" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full motion-reduce:animate-none" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-28 rounded-2xl motion-reduce:animate-none" />
              ))}
            </div>

            <Skeleton className="mt-6 h-96 rounded-2xl motion-reduce:animate-none" />
          </main>
        </div>
      </div>
    </div>
  );
}
