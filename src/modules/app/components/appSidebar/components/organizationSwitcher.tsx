import { ChevronDown, Store } from 'lucide-react';

import type { JoinedOrganization } from '@/modules/organizations/types/organization.types';

import { getOrganizationRoleLabel } from '../helpers/appSidebar.helper';

interface OrganizationSwitcherProps {
  organizations: JoinedOrganization[];
  activeOrganization: JoinedOrganization;
  switching: boolean;
  onSwitch(organizationId: string): void;
}

export function OrganizationSwitcher({
  organizations,
  activeOrganization,
  switching,
  onSwitch,
}: OrganizationSwitcherProps) {
  return (
    <div className="px-4 pb-5">
      <div className="relative rounded-2xl border border-sidebar-border bg-background p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Store aria-hidden="true" className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <label htmlFor="active-organization" className="sr-only">
              Negócio ativo
            </label>
            <div className="relative">
              <select
                id="active-organization"
                value={activeOrganization.id}
                disabled={switching}
                onChange={(event) => onSwitch(event.target.value)}
                className="w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm font-semibold outline-none disabled:cursor-wait"
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>

              {organizations.length > 1 && (
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-muted-foreground"
                />
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{getOrganizationRoleLabel(activeOrganization.role)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
