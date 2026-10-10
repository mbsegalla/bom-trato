import type { Metadata } from 'next';

import { LeadDetailsContent } from '@/modules/leads/components/leadDetailsContent';

export const metadata: Metadata = {
  title: 'Oportunidade',
};

interface LeadDetailsPageProps {
  params: Promise<{ leadId: string }>;
}

export default async function LeadDetailsPage({ params }: LeadDetailsPageProps) {
  const { leadId } = await params;

  return <LeadDetailsContent leadId={leadId} />;
}
