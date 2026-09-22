import { Skeleton } from '@/components/ui/skeleton';

export function EmailVerificationSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando verificação de e-mail" className="mx-auto w-full max-w-md">
      <span role="status" className="sr-only">
        Carregando verificação de e-mail...
      </span>

      <div aria-hidden="true">
        <Skeleton className="size-14 rounded-2xl motion-reduce:animate-none" />

        <Skeleton className="mt-6 h-9 w-4/5 motion-reduce:animate-none" />

        <div className="mt-4 space-y-2">
          <Skeleton className="h-5 w-full motion-reduce:animate-none" />
          <Skeleton className="h-5 w-3/4 motion-reduce:animate-none" />
        </div>

        <Skeleton className="mt-8 h-12 w-full rounded-xl motion-reduce:animate-none" />
        <Skeleton className="mx-auto mt-6 h-4 w-48 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
