import { Skeleton } from '@/components/ui/skeleton';

export function RegisterFormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando cadastro" className="mx-auto w-full max-w-md">
      <span role="status" className="sr-only">
        Carregando cadastro...
      </span>

      <div aria-hidden="true">
        <Skeleton className="h-3 w-52 motion-reduce:animate-none" />
        <Skeleton className="mt-4 h-10 w-full motion-reduce:animate-none" />
        <Skeleton className="mt-2 h-10 w-3/4 motion-reduce:animate-none" />
        <Skeleton className="mt-4 h-5 w-full motion-reduce:animate-none" />
        <Skeleton className="mt-6 h-28 w-full rounded-2xl motion-reduce:animate-none" />

        <div className="mt-7 space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
              <Skeleton className="h-12 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-6 h-12 w-full rounded-xl motion-reduce:animate-none" />
        <Skeleton className="mx-auto mt-6 h-4 w-48 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
