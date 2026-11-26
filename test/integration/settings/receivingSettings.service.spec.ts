import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getReceivingSettings, saveReceivingSettings } from '@/modules/settings/services/receivingSettings.service';

import { mockHttp, organizationId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/receiving-settings';
const disabled = {
  pixEnabled: false as const,
  pixKeyType: null,
  pixKey: null,
  merchantName: null,
  merchantCity: null,
  version: 1,
};

describe('receiving settings HTTP service', () => {
  it('does not accept a disabled projection that exposes payment key data', async (t) => {
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route)
        return success({
          ...disabled,
          pixKey: 'private',
          canConfigure: true,
          encryptionAvailable: true,
        });
      throw new Error('Unexpected request');
    });

    await restoreSession();

    await assert.rejects(getReceivingSettings(organizationId), /interpretar/);
  });

  it('preserves optimistic versioning and does not retry a conflict', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return new Response(null, { status: 409 });
      throw new Error('Unexpected request');
    });

    await restoreSession();
    const input = { ...disabled, confirmed: false as const };

    await assert.rejects(saveReceivingSettings(organizationId, input), /alterados/);

    const requests = calls.filter((call) => call.path === route);

    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'PUT');
    assert.deepEqual(JSON.parse(String(requests[0].body)), input);
  });
});
