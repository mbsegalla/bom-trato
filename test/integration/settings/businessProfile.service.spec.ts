import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  getBusinessProfile,
  removeBusinessLogo,
  updateBusinessProfile,
  uploadBusinessLogo,
} from '@/modules/settings/services/business.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/profile';
const profile = {
  id: organizationId,
  name: 'Fixture organization',
  email: null,
  logoUrl: null,
  phone: null,
  documentType: null,
  document: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  defaultReceivableDueDays: 15,
  autoQuoteFollowUpEnabled: false,
  autoWorkOrderReminderEnabled: false,
  autoReviewRequestEnabled: false,
  autoReceivableReminderEnabled: false,
};

describe('business profile contracts', () => {
  it('deduplicates private profiles only within the same organization', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/profile')) return success({ ...profile, id: call.path.split('/')[3] });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = getBusinessProfile(organizationId);
    const duplicate = getBusinessProfile(organizationId);
    const other = getBusinessProfile(receivableId);

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, other);

    const [result, otherResult] = await Promise.all([first, other]);

    assert.equal(result.id, organizationId);
    assert.equal(otherResult.id, receivableId);
    assert.equal(calls.filter((call) => call.path.endsWith('/profile')).length, 2);
  });

  it('validates profile updates and reads the new logo state after upload and removal', async (t) => {
    const logoUrl = 'https://app.example.invalid/logo.webp';

    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route && call.method === 'PATCH') return success({ ...profile, defaultReceivableDueDays: 30 });
      if (call.path === route + '/logo' && call.method === 'POST') return success({ ...profile, logoUrl });
      if (call.path === route + '/logo' && call.method === 'DELETE') return success(profile);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal(
      (await updateBusinessProfile(organizationId, { defaultReceivableDueDays: 30 })).defaultReceivableDueDays,
      30,
    );
    assert.equal(
      (await uploadBusinessLogo(organizationId, new File(['fixture'], 'logo.webp', { type: 'image/webp' }))).logoUrl,
      logoUrl,
    );
    assert.equal((await removeBusinessLogo(organizationId)).logoUrl, null);

    const requests = calls.filter((call) => call.path.startsWith(route));

    assert.deepEqual(
      requests.map((call) => call.method),
      ['PATCH', 'POST', 'DELETE'],
    );
    assert.deepEqual(JSON.parse(String(requests[0]?.body)), { defaultReceivableDueDays: 30 });
  });

  it('clears failed profile reads and rejects malformed business settings', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        if (attempt === 1) return new Response(null, { status: 503 });
        if (attempt === 2) return success({ ...profile, defaultReceivableDueDays: -1 });
        return success(profile);
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getBusinessProfile(organizationId), /atualizado/);
    await assert.rejects(getBusinessProfile(organizationId), /interpretar/);
    assert.equal((await getBusinessProfile(organizationId)).name, profile.name);
    assert.equal(attempt, 3);
  });
  for (const [status, message] of [
    [400, /Confira os dados/],
    [403, /Somente o administrador/],
    [404, /Negócio não encontrado/],
    [413, /no máximo 2 MB/],
    [503, /negócio está sendo atualizado/],
    [500, /salvar os dados/],
  ] as const) {
    it('preserves business profile error ' + status + ' without retrying a write', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status });
      });
      await restoreSession();
      await assert.rejects(updateBusinessProfile(organizationId, { name: 'Updated fixture' }), message);
      assert.equal(calls.filter((call) => call.path === route).length, 1);
    });
  }

  it('rejects malformed profile update and logo responses', async (t) => {
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ ...profile, logoUrl: 'not-a-url' });
    });
    await restoreSession();
    await assert.rejects(updateBusinessProfile(organizationId, { name: 'Updated fixture' }), /interpretar/);
    await assert.rejects(
      uploadBusinessLogo(organizationId, new File(['fixture'], 'logo.png', { type: 'image/png' })),
      /interpretar/,
    );
    await assert.rejects(removeBusinessLogo(organizationId), /interpretar/);
  });

  it('does not retry an oversized upload or failed logo removal', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: call.method === 'POST' ? 413 : 500 });
    });
    await restoreSession();
    await assert.rejects(
      uploadBusinessLogo(organizationId, new File(['fixture'], 'logo.png', { type: 'image/png' })),
      /no máximo 2 MB/,
    );
    await assert.rejects(removeBusinessLogo(organizationId), /remover a logo/);
    assert.equal(calls.filter((call) => call.path === route + '/logo').length, 2);
  });
});
