import { Skeleton } from '@/components/ui/skeleton';
import { BusinessSettingsSkeleton } from '@/modules/settings/components/businessSettingsSkeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-10 w-56 motion-reduce:animate-none" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full motion-reduce:animate-none" />

      <div className="mt-8 flex flex-wrap gap-2">
        <Skeleton className="h-10 w-28 rounded-xl motion-reduce:animate-none" />
        <Skeleton className="h-10 w-24 rounded-xl motion-reduce:animate-none" />
        <Skeleton className="h-10 w-32 rounded-xl motion-reduce:animate-none" />
        <Skeleton className="h-10 w-28 rounded-xl motion-reduce:animate-none" />
      </div>

      <div className="mt-6">
        <BusinessSettingsSkeleton />
      </div>
    </div>
  );
}
