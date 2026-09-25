import type { Metadata } from 'next';

import { SettingsContent, type SettingsTab } from '@/modules/settings/components/settingsContent';

export const metadata: Metadata = {
  title: 'Configurações',
};

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { tab } = await searchParams;

  let initialTab: SettingsTab = 'business';

  if (tab === 'team') {
    initialTab = 'team';
  } else if (tab === 'billing') {
    initialTab = 'billing';
  } else if (tab === 'security') {
    initialTab = 'security';
  }

  return <SettingsContent initialTab={initialTab} />;
}
