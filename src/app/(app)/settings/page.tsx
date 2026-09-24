import type { Metadata } from 'next';

import { SettingsContent } from '@/modules/settings/components/settingsContent';

export const metadata: Metadata = {
  title: 'Configurações',
};

export default function SettingsPage() {
  return <SettingsContent />;
}
