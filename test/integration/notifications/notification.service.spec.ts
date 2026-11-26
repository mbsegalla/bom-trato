import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  createNotificationStreamTicket,
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  notificationStreamUrl,
} from '@/modules/notifications/services/notification.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/notifications';

describe('notifications HTTP service', () => {
  it('keeps list requests scoped by organization and validates the unread count', async (t) => {
    let malformed = false;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return success({ items: [], unreadCount: malformed ? -1 : call.path.includes(organizationId) ? 1 : 0 });
    });

    await restoreSession();
    const first = listInAppNotifications(organizationId);

    assert.strictEqual(first, listInAppNotifications(organizationId));
    assert.deepEqual(await Promise.all([first, listInAppNotifications(receivableId)]), [
      { items: [], unreadCount: 1 },
      { items: [], unreadCount: 0 },
    ]);

    malformed = true;

    await assert.rejects(listInAppNotifications(organizationId), /interpretar/);
    assert.equal(calls.filter((call) => call.path.includes('/notifications?')).length, 3);
  });

  it('uses only the scoped stream ticket in the stream URL and sends read mutations to the scoped endpoints', async (t) => {
    const ticket = 'a'.repeat(43);
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/stream-ticket')) return success({ ticket, expiresAt: '2026-01-01T00:00:00Z' });

      return new Response(null, { status: 204 });
    });

    await restoreSession();
    const issued = await createNotificationStreamTicket(organizationId);
    const url = new URL(notificationStreamUrl(organizationId, issued.ticket));

    assert.equal(url.pathname, route + '/stream');
    assert.deepEqual([...url.searchParams.entries()], [['ticket', ticket]]);

    await markInAppNotificationRead(organizationId, issuanceId);
    await markAllInAppNotificationsRead(organizationId);

    assert.deepEqual(
      calls.filter((call) => call.path.startsWith(route)).map((call) => [call.method, call.path]),
      [
        ['POST', route + '/stream-ticket'],
        ['POST', route + '/' + issuanceId + '/read'],
        ['POST', route + '/read-all'],
      ],
    );
  });
});
