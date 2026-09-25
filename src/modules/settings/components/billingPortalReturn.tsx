'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';

import { storeActiveOrganizationId } from '@/modules/organizations/services/activeOrganization.storage';

interface BillingPortalReturnProps {
  organizationId: string | null;
}

export function BillingPortalReturn({ organizationId }: BillingPortalReturnProps) {
  useEffect(() => {
    if (organizationId) {
      storeActiveOrganizationId(organizationId);
    }

    window.location.replace('/settings?tab=billing');
  }, [organizationId]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <LoaderCircle className="size-7 animate-spin text-primary" />

      <p className="mt-4 text-sm text-muted-foreground">Voltando para sua assinatura...</p>
    </div>
  );
}
