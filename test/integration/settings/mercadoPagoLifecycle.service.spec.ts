import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  completeMercadoPagoConnection,
  disconnectMercadoPagoConnection,
  getMercadoPagoConnection,
} from '@/modules/settings/services/mercadoPagoConnection.service';

import { mockHttp, organizationId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/mercado-pago/connection';
const date = '2026-01-01T00:00:00.000Z';
const connected = {
  available: true,
  liveMode: true,
  canConnect: true,
  canDisconnect: true,
  status: 'CONNECTED',
  accountId: '123456789',
  connectedAt: date,
  expiresAt: '2030-01-01T00:00:00.000Z',
};

describe('Mercado Pago connection lifecycle', () => {
  it('reads status and disconnects only the scoped organization without exposing provider credentials', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route && call.method === 'GET')
        return success({ ...connected, accessToken: 'private-fixture' });
      if (call.path === route && call.method === 'DELETE') return new Response(null, { status: 204 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const result = await getMercadoPagoConnection(organizationId);

    assert.equal(result.accountId, connected.accountId);
    assert.deepEqual(result.connectedAt, new Date(date));
    assert.equal('accessToken' in result, false);

    await disconnectMercadoPagoConnection(organizationId);

    assert.deepEqual(
      calls.filter((call) => call.path === route).map((call) => call.method),
      ['GET', 'DELETE'],
    );
  });

  it('parses the completion identity and rejects a malformed successful exchange without replaying it', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/mercado-pago/connection/complete') {
        attempt++;

        return success({
          organizationId,
          organizationName: 'Fixture business',
          accountId: attempt === 1 ? connected.accountId : 'invalid',
          liveMode: true,
        });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await completeMercadoPagoConnection('fixture-state', 'fixture-code')).organizationId, organizationId);
    await assert.rejects(completeMercadoPagoConnection('fixture-state', 'fixture-code'), /confirmar o resultado/);
    assert.equal(calls.filter((call) => call.path.endsWith('/complete')).length, 2);
  });

  it('rejects malformed status and reports denied disconnection and temporary outages', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        if (attempt === 1) return success({ ...connected, accountId: '000' });
        if (attempt === 2) return new Response(null, { status: 403 });
        return new Response(null, { status: 503 });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getMercadoPagoConnection(organizationId), /interpretar/);
    await assert.rejects(disconnectMercadoPagoConnection(organizationId), /proprietário autorizado/);
    await assert.rejects(getMercadoPagoConnection(organizationId), /indisponível/);
    assert.equal(attempt, 3);
  });
});
