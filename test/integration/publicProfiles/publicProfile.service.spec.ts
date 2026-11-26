import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getPublicProfileSettings, updatePublicProfile } from '@/modules/publicProfiles/services/publicProfile.service';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/public-profile';
const date = '2026-01-01T00:00:00Z';
const input = {
  slug: 'fixture-professional',
  headline: 'Fixture headline',
  description: null,
  whatsappPhone: '(34) 99999-1234',
  whatsappEnabled: true,
  published: true,
  serviceIds: [receivableId],
};
const state = {
  id: issuanceId,
  slug: input.slug,
  headline: input.headline,
  description: null,
  whatsappPhone: '34999991234',
  whatsappEnabled: true,
  published: true,
  publishedAt: date,
  selectedServiceIds: [receivableId],
  city: 'Uberlândia',
  state: 'MG',
};

describe('authenticated public profile HTTP contracts', () => {
  it('uses the exact organization path and sends only the settings input with authenticated CSRF headers', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success(state);

      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const read = await getPublicProfileSettings(organizationId);
    const updated = await updatePublicProfile(organizationId, input);

    assert.deepEqual(read.selectedServiceIds, [receivableId]);
    assert.deepEqual(updated.publishedAt, new Date(date));

    const requests = calls.filter((call) => call.path === route);

    assert.deepEqual(requests.map((call) => call.method), ['GET', 'PATCH']);
    assert.equal(requests[1]?.headers.get('authorization'), 'Bearer fixture-access');
    assert.equal(requests[1]?.headers.get('x-csrf-token'), 'fixture-csrf');
    assert.deepEqual(JSON.parse(String(requests[1]?.body)), input);
  });

  it('maps slug conflicts, missing locations and unavailable writes without resubmitting them', async (t) => {
    const failures = [
      { status: 409, code: 'PUBLIC_PROFILE_SLUG_TAKEN' },
      { status: 400, code: 'PUBLIC_PROFILE_LOCATION_REQUIRED' },
      { status: 503, code: 'UNAVAILABLE' },
    ];
    let attempt = 0;

    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        const failure = failures[attempt++]!;

        return Response.json({ success: false, error: { code: failure.code } }, { status: failure.status });
      }

      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(updatePublicProfile(organizationId, input), /URL já está sendo utilizada/);
    await assert.rejects(updatePublicProfile(organizationId, input), /Informe cidade e estado/);
    await assert.rejects(updatePublicProfile(organizationId, input), /Não foi possível salvar/);
    assert.equal(calls.filter((call) => call.path === route && call.method === 'PATCH').length, 3);
  });

  it('rejects malformed service identifiers and missing visibility information before rendering settings', async (t) => {
    const responses = [
      { ...state, selectedServiceIds: ['invalid'] },
      { ...state, published: undefined },
      state,
    ];
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success(responses[attempt++]);

      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getPublicProfileSettings(organizationId), /interpretar os dados da vitrine/);
    await assert.rejects(getPublicProfileSettings(organizationId), /interpretar os dados da vitrine/);
    assert.equal((await getPublicProfileSettings(organizationId)).published, true);
  });
});
