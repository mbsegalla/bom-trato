import { Skeleton } from '@/components/ui/skeleton';

export function ReceivableSummarySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando resumo financeiro"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl motion-reduce:animate-none" />

            <div className="flex-1">
              <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
              <Skeleton className="mt-2 h-7 w-28 motion-reduce:animate-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReceivableListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando recebíveis">
      <div className="grid grid-cols-6 gap-5 border-b border-border bg-muted/40 px-6 py-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-3 w-20 motion-reduce:animate-none" />
        ))}
      </div>

      <div className="divide-y divide-border">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid min-h-18 grid-cols-6 items-center gap-5 px-6 py-4">
            <div>
              <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
              <Skeleton className="mt-2 h-3 w-24 motion-reduce:animate-none" />
            </div>

            <Skeleton className="h-6 w-24 rounded-full motion-reduce:animate-none" />
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReceivableDetailsSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto max-w-7xl">
      <Skeleton className="h-4 w-44 motion-reduce:animate-none" />

      <div className="mt-6 flex justify-between gap-5">
        <div>
          <Skeleton className="h-10 w-72 max-w-full motion-reduce:animate-none" />
          <Skeleton className="mt-3 h-4 w-48 motion-reduce:animate-none" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg motion-reduce:animate-none" />
          <Skeleton className="h-10 w-36 rounded-lg motion-reduce:animate-none" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl motion-reduce:animate-none" />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <Skeleton className="h-96 rounded-2xl motion-reduce:animate-none" />

        <div className="space-y-5">
          <Skeleton className="h-48 rounded-2xl motion-reduce:animate-none" />
          <Skeleton className="h-48 rounded-2xl motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

export function ReceivablePaymentsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="border-l-2 border-border pl-4">
          <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
          <Skeleton className="mt-2 h-3 w-52 motion-reduce:animate-none" />
          <Skeleton className="mt-2 h-3 w-32 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
