import { CalendarDays } from 'lucide-react';
import type { Metadata } from 'next';

import { AppPlaceholder } from '@/modules/app/components/appPlaceholder';

export const metadata: Metadata = {
  title: 'Agendamentos',
};

export default function SchedulePage() {
  return (
    <AppPlaceholder
      icon={CalendarDays}
      title="Agendamentos"
      description="Aqui vamos visualizar os serviços agendados e organizar a rotina de atendimento."
    />
  );
}
