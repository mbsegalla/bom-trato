import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { automationEventsResponseSchema } from '../schemas/automation.schema';
import type { AutomationEvent } from '../types/automation.types';

export async function listAutomationEvents(organizationId: string): Promise<AutomationEvent[]> {
  const response = await authenticatedFetch(
    `/api/organizations/${encodeURIComponent(organizationId)}/notifications/automation-events?limit=20`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar o histórico das automações.');
  }

  const payload: unknown = await response.json();

  const parsed = automationEventsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o histórico das automações.');
  }

  return parsed.data.items;
}
