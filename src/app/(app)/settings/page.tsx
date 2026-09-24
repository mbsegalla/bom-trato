import { Settings } from 'lucide-react';
import type { Metadata } from 'next';

import { AppPlaceholder } from '@/modules/app/components/appPlaceholder';

export const metadata: Metadata = {
  title: 'Configurações',
};

export default function SettingsPage() {
  return (
    <AppPlaceholder
      icon={Settings}
      title="Configurações"
      description="Aqui vamos reunir as configurações do negócio, equipe, assinatura e preferências da conta."
    />
  );
}
