import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getReceivingSettings, saveReceivingSettings } from '@/modules/settings/services/receivingSettings.service';

import { mockHttp, organizationId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/receiving-settings';
const enabled = {
  pixEnabled: true as const,
  pixKeyType: 'EMAIL' as const,
  pixKey: 'fixture@example.invalid',
  merchantName: 'FIXTURE',
  merchantCity: 'UBERLANDIA',
  version: 2,
};
const disabled = {
  pixEnabled: false as const,
  pixKeyType: null,
  pixKey: null,
  merchantName: null,
  merchantCity: null,
  version: 3,
};

describe('receiving settings lifecycle', () => {
  it('reads the private destination, saves an explicit confirmation and clears all key fields when disabled', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path !== route) throw new Error('Unexpected request: ' + call.path);
      if (call.method === 'GET') return success({ ...enabled, canConfigure: true, encryptionAvailable: true });

      const body = JSON.parse(String(call.body));

      return success({ ...(body.pixEnabled ? enabled : disabled), canConfigure: true, encryptionAvailable: true });
    });

    await restoreSession();

    assert.equal((await getReceivingSettings(organizationId)).pixKey, enabled.pixKey);
    await saveReceivingSettings(organizationId, { ...enabled, confirmed: true });
    const cleared = await saveReceivingSettings(organizationId, { ...disabled, confirmed: false });

    assert.equal(cleared.pixEnabled, false);
    assert.equal(cleared.pixKey, null);

    const requests = calls.filter((call) => call.path === route);

    assert.deepEqual(
      requests.map((call) => call.method),
      ['GET', 'PUT', 'PUT'],
    );
    assert.deepEqual(JSON.parse(String(requests[1]?.body)), { ...enabled, confirmed: true });
    assert.deepEqual(JSON.parse(String(requests[2]?.body)), { ...disabled, confirmed: false });
    assert.ok(requests.every((call) => call.headers.has('Authorization') && call.cache === 'no-store'));
  });

  it('distinguishes validation, owner authorization and encryption service availability errors', async (t) => {
    const statuses = [400, 403, 503, 500];
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return new Response(null, { status: statuses.shift() });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(
      saveReceivingSettings(organizationId, { ...enabled, confirmed: true }),
      /formato da chave Pix/,
    );
    await assert.rejects(getReceivingSettings(organizationId), /proprietário autorizado/);
    await assert.rejects(getReceivingSettings(organizationId), /indisponíveis/);
    await assert.rejects(getReceivingSettings(organizationId), /consultar ou salvar/);
    assert.equal(calls.filter((call) => call.path === route).length, 4);
  });

  it('rejects a configurable projection when encryption is unavailable', async (t) => {
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success({ ...enabled, canConfigure: true, encryptionAvailable: false });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getReceivingSettings(organizationId), /interpretar/);
  });
});
