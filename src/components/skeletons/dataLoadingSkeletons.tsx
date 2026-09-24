import { Skeleton } from '@/components/ui/skeleton';

interface ListContentSkeletonProps {
  columns?: number;
  rows?: number;
  label?: string;
}

interface DetailContentSkeletonProps {
  label?: string;
}

interface HistoryRowsSkeletonProps {
  rows?: number;
  label?: string;
}

interface InlineOptionsSkeletonProps {
  rows?: number;
}

export function ListContentSkeleton({ columns = 5, rows = 6, label = 'Carregando dados' }: ListContentSkeletonProps) {
  const gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;

  return (
    <div aria-busy="true" aria-label={label}>
      <span role="status" className="sr-only">
        {label}...
      </span>

      <div aria-hidden="true" className="overflow-hidden">
        <div className="grid gap-5 border-b border-border bg-muted/40 px-6 py-3" style={{ gridTemplateColumns }}>
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-3 w-20 max-w-full motion-reduce:animate-none" />
          ))}
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="grid min-h-18 items-center gap-5 px-6 py-4" style={{ gridTemplateColumns }}>
              {Array.from({ length: columns }, (_, columnIndex) => (
                <div key={columnIndex}>
                  <Skeleton
                    className={
                      columnIndex === 0
                        ? 'h-4 w-36 max-w-full motion-reduce:animate-none'
                        : 'h-4 w-24 max-w-full motion-reduce:animate-none'
                    }
                  />

                  {columnIndex === 0 && rowIndex % 2 === 0 && (
                    <Skeleton className="mt-2 h-3 w-48 max-w-full motion-reduce:animate-none" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Skeleton className="h-4 w-20 motion-reduce:animate-none" />

          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-lg motion-reduce:animate-none" />
            <Skeleton className="size-8 rounded-lg motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailContentSkeleton({ label = 'Carregando detalhes' }: DetailContentSkeletonProps) {
  return (
    <div aria-busy="true" aria-label={label} className="mx-auto max-w-7xl">
      <span role="status" className="sr-only">
        {label}...
      </span>

      <div aria-hidden="true">
        <Skeleton className="h-4 w-44 motion-reduce:animate-none" />

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-72 max-w-full motion-reduce:animate-none" />
              <Skeleton className="h-7 w-20 rounded-full motion-reduce:animate-none" />
            </div>

            <Skeleton className="mt-3 h-4 w-52 motion-reduce:animate-none" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg motion-reduce:animate-none" />
            <Skeleton className="h-9 w-28 rounded-lg motion-reduce:animate-none" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl motion-reduce:animate-none" />

                <div className="flex-1">
                  <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-6 w-28 motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <Skeleton className="h-5 w-44 motion-reduce:animate-none" />
              <Skeleton className="mt-2 h-3 w-28 motion-reduce:animate-none" />
            </div>

            <div className="divide-y divide-border">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="p-5">
                  <Skeleton className="h-4 w-48 motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-3 w-64 max-w-full motion-reduce:animate-none" />
                  <Skeleton className="mt-2 h-3 w-40 motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <Skeleton className="h-5 w-32 motion-reduce:animate-none" />

                <div className="mt-5 space-y-3">
                  <Skeleton className="h-4 w-full motion-reduce:animate-none" />
                  <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
                  <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryRowsSkeleton({ rows = 3, label = 'Carregando histórico' }: HistoryRowsSkeletonProps) {
  return (
    <div aria-busy="true" aria-label={label} className="mt-5">
      <span role="status" className="sr-only">
        {label}...
      </span>

      <div aria-hidden="true" className="space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="border-l-2 border-border pl-4">
            <Skeleton className="h-4 w-48 motion-reduce:animate-none" />
            <Skeleton className="mt-2 h-3 w-36 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InlineOptionsSkeleton({ rows = 1 }: InlineOptionsSkeletonProps) {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Carregando opções...
      </span>

      <div aria-hidden="true" className="space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-xl motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
