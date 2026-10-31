import { OrganizationLogo } from '@/modules/organizations/components/organizationLogo';
import type { JoinedOrganization } from '@/modules/organizations/types/organization.types';

interface OrganizationIdentityProps {
  organization: JoinedOrganization;
}

export function OrganizationIdentity({ organization }: OrganizationIdentityProps) {
  return (
    <div className="px-5 pb-5">
      <div className="flex items-center gap-3 px-1 py-2">
        <OrganizationLogo name={organization.name} logoUrl={organization.logoUrl} variant="store" />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{organization.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Empresa</p>
        </div>
      </div>
    </div>
  );
}
