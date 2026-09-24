import type { Metadata } from 'next';

import { ScheduleContent } from '@/modules/schedule/components/scheduleContent';

export const metadata: Metadata = {
  title: 'Agendamentos',
};

export default function SchedulePage() {
  return <ScheduleContent />;
}
