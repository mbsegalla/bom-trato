import { Skeleton } from '@/components/ui/skeleton';
import { TeamSettingsSkeleton } from '@/modules/settings/components/teamSettingsSkeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-10 w-56 motion-reduce:animate-none" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full motion-reduce:animate-none" />

      <div className="mt-8">
        <TeamSettingsSkeleton />
      </div>
    </div>
  );
}
