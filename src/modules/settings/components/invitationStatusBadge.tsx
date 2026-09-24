import { cn } from '@/lib/utils';

import type { OrganizationInvitationStatus } from '../types/team.types';

interface InvitationStatusBadgeProps {
  status: OrganizationInvitationStatus;
}

function invitationStatusLabel(status: OrganizationInvitationStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pendente';

    case 'ACCEPTED':
      return 'Aceito';

    case 'REVOKED':
      return 'Revogado';

    case 'EXPIRED':
      return 'Expirado';
  }
}

export function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-medium',
        status === 'PENDING' && 'bg-brand-muted text-primary',
        status === 'ACCEPTED' && 'bg-success-surface text-success',
        status === 'EXPIRED' && 'bg-warning-surface text-warning',
        status === 'REVOKED' && 'bg-muted text-muted-foreground',
      )}
    >
      {invitationStatusLabel(status)}
    </span>
  );
}
