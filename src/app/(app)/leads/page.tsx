import type { Metadata } from 'next';

import { LeadsContent } from '@/modules/leads/components/leadsContent';

export const metadata: Metadata = {
  title: 'Oportunidades',
};

export default function LeadsPage() {
  return <LeadsContent />;
}
