import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { updateBusinessProfile, uploadBusinessLogo } from '@/modules/settings/services/business.service';

import { mockHttp, organizationId, sessionResponse, success } from '../../support/http.fixture';

describe('business settings HTTP boundary', () => {
  it('sends only changed settings and surfaces permission errors', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return new Response(null, { status: 403 });
    });

    await restoreSession();
    const input = { autoReceivableReminderEnabled: true, defaultReceivableDueDays: 15 };

    await assert.rejects(updateBusinessProfile(organizationId, input), /administrador/);
    assert.equal(calls.at(-1)?.path, '/api/organizations/' + organizationId + '/profile');
    assert.equal(calls.at(-1)?.method, 'PATCH');
    assert.deepEqual(JSON.parse(String(calls.at(-1)?.body)), input);
  });

  it('uploads logo using multipart form data and rejects an oversize response', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return new Response(null, { status: 413 });
    });

    await restoreSession();

    await assert.rejects(
      uploadBusinessLogo(organizationId, new File(['fixture'], 'fixture.png', { type: 'image/png' })),
      /2 MB/,
    );

    const upload = calls.at(-1)!;

    assert.equal(upload.path, '/api/organizations/' + organizationId + '/profile/logo');
    assert.ok(upload.body instanceof FormData);
    assert.equal((upload.body.get('logo') as File).name, 'fixture.png');
  });
});
