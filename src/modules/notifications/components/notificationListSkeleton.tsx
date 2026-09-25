import { Skeleton } from '@/components/ui/skeleton';

export function NotificationListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando notificações" className="divide-y divide-border">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex gap-3 px-5 py-4">
          <Skeleton className="size-9 shrink-0 rounded-xl motion-reduce:animate-none" />

          <div className="flex-1">
            <Skeleton className="h-4 w-36 motion-reduce:animate-none" />
            <Skeleton className="mt-2 h-3 w-full motion-reduce:animate-none" />
            <Skeleton className="mt-2 h-3 w-20 motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
