import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  inAppNotificationsResponseSchema,
  notificationStreamTicketResponseSchema,
} from '../schemas/notification.schema';
import type { InAppNotifications, NotificationStreamTicket } from '../types/notification.types';

const notificationFlights = new Map<string, Promise<InAppNotifications>>();

function notificationPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/notifications`;
}

async function requestNotifications(organizationId: string): Promise<InAppNotifications> {
  const response = await authenticatedFetch(`${notificationPath(organizationId)}?limit=20`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar suas notificações.');
  }

  const payload: unknown = await response.json();

  const parsed = inAppNotificationsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar suas notificações.');
  }

  return parsed.data;
}

export function listInAppNotifications(organizationId: string): Promise<InAppNotifications> {
  const existing = notificationFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestNotifications(organizationId);

  notificationFlights.set(organizationId, request);

  const cleanup = () => {
    if (notificationFlights.get(organizationId) === request) {
      notificationFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function createNotificationStreamTicket(organizationId: string): Promise<NotificationStreamTicket> {
  const response = await authenticatedFetch(`${notificationPath(organizationId)}/stream-ticket`, {
    method: 'POST',
  });

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível conectar às notificações em tempo real.');
  }

  const payload: unknown = await response.json();

  const parsed = notificationStreamTicketResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o ticket de notificações.');
  }

  return parsed.data;
}

export function notificationStreamUrl(organizationId: string, ticket: string): string {
  const { baseUrl } = getApiConfig();

  const url = new URL(`${notificationPath(organizationId)}/stream`, baseUrl);

  url.searchParams.set('ticket', ticket);

  return url.toString();
}

export async function markInAppNotificationRead(organizationId: string, notificationId: string): Promise<void> {
  const response = await authenticatedFetch(
    `${notificationPath(organizationId)}/${encodeURIComponent(notificationId)}/read`,
    {
      method: 'POST',
    },
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível atualizar a notificação.');
  }
}

export async function markAllInAppNotificationsRead(organizationId: string): Promise<void> {
  const response = await authenticatedFetch(`${notificationPath(organizationId)}/read-all`, {
    method: 'POST',
  });

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível marcar as notificações como lidas.');
  }
}
