const ACTIVE_ORGANIZATION_KEY = 'bom-trato:active-organization';

export function getStoredActiveOrganizationId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_ORGANIZATION_KEY);
}

export function storeActiveOrganizationId(organizationId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId);
}
