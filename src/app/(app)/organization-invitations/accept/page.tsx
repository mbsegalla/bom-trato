import type { Metadata } from 'next';

import { OrganizationInvitationAccept } from '@/modules/settings/components/organizationInvitationAccept';

export const metadata: Metadata = {
  title: 'Convite para equipe | Bom Trato',
  description: 'Aceite seu convite para fazer parte de uma equipe no Bom Trato.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrganizationInvitationAcceptPage() {
  return <OrganizationInvitationAccept />;
}
