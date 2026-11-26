import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  createNotificationStreamTicket,
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
} from '@/modules/notifications/services/notification.service';

import { issuanceId, mockHttp, organizationId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/notifications';
const ticket = 'a'.repeat(43);
const date = '2030-01-01T00:00:00.000Z';

describe('notification error recovery and ticket validation', () => {
  it('clears failed list flights and allows the next explicit refresh', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route + '?')) {
        attempt++;

        return attempt === 1
          ? new Response(null, { status: 503 })
          : success({
              items: [
                {
                  id: issuanceId,
                  organizationId,
                  type: 'PAYMENT_FAILED',
                  title: 'Fixture',
                  message: 'Fixture',
                  href: '/settings/billing',
                  readAt: null,
                  createdAt: date,
                },
              ],
              unreadCount: 1,
            });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = listInAppNotifications(organizationId);

    assert.strictEqual(first, listInAppNotifications(organizationId));
    await assert.rejects(first, /carregar suas notificações/);

    const result = await listInAppNotifications(organizationId);

    assert.equal(result.unreadCount, 1);
    assert.deepEqual(result.items[0]?.createdAt, new Date(date));
    assert.equal(calls.filter((call) => call.path.startsWith(route + '?')).length, 2);
  });

  it('rejects malformed stream tickets and does not silently replay rejected ticket creation', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/stream-ticket') {
        attempt++;
        if (attempt === 1) return success({ ticket: 'invalid', expiresAt: date });
        if (attempt === 2) return new Response(null, { status: 503 });

        return success({ ticket, expiresAt: date });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(createNotificationStreamTicket(organizationId), /interpretar o ticket/);
    await assert.rejects(createNotificationStreamTicket(organizationId), /tempo real/);
    assert.deepEqual(await createNotificationStreamTicket(organizationId), { ticket, expiresAt: new Date(date) });
    assert.equal(calls.filter((call) => call.path.endsWith('/stream-ticket')).length, 3);
  });

  it('reports failed single and bulk read mutations so the UI can refresh rather than assume success', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route)) return new Response(null, { status: 503 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(markInAppNotificationRead(organizationId, issuanceId), /atualizar a notificação/);
    await assert.rejects(markAllInAppNotificationsRead(organizationId), /marcar as notificações como lidas/);

    assert.deepEqual(
      calls.filter((call) => call.path.startsWith(route)).map((call) => [call.method, call.path]),
      [
        ['POST', route + '/' + issuanceId + '/read'],
        ['POST', route + '/read-all'],
      ],
    );
  });
});
