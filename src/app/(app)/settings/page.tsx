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

  const initialTab: SettingsTab = tab === 'billing' ? 'billing' : 'team';

  return <SettingsContent initialTab={initialTab} />;
}
