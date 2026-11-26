import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  getManagementPortfolio,
  publishPortfolioPhoto,
  revokeManagementPortfolioConsent,
} from '@/modules/workOrders/services/workOrderPortfolio.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/portfolio';
const photo = { id: issuanceId, stage: 'BEFORE', visibleInPortal: true, consented: true, published: false };

describe('private portfolio HTTP contracts', () => {
  it('reads consent and submits only the scoped publication and revocation actions', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success({ photos: [photo] });
      if (call.path === route + '/' + issuanceId + '/publish')
        return success({ photos: [{ ...photo, published: true }] });
      if (call.path === route + '/' + issuanceId + '/revoke-consent')
        return success({ photos: [{ ...photo, consented: false }] });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await getManagementPortfolio(organizationId, receivableId)).photos[0]?.published, false);
    assert.equal(
      (await publishPortfolioPhoto(organizationId, receivableId, issuanceId, true)).photos[0]?.published,
      true,
    );
    assert.equal(
      (await revokeManagementPortfolioConsent(organizationId, receivableId, issuanceId)).photos[0]?.consented,
      false,
    );

    const requests = calls.filter((call) => call.path.startsWith(route));

    assert.deepEqual(
      requests.map((call) => [call.method, call.path]),
      [
        ['GET', route],
        ['POST', route + '/' + issuanceId + '/publish'],
        ['POST', route + '/' + issuanceId + '/revoke-consent'],
      ],
    );
    assert.deepEqual(JSON.parse(String(requests[1]?.body)), { publish: true });
  });

  it('reports revoked authorization, permission failure and malformed management responses without replaying writes', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route)) {
        attempt++;
        if (attempt === 1) return new Response(null, { status: 409 });
        if (attempt === 2) return new Response(null, { status: 403 });

        return success({ photos: [{ ...photo, stage: 'INVALID' }] });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(publishPortfolioPhoto(organizationId, receivableId, issuanceId, true), /não está autorizada/);
    await assert.rejects(revokeManagementPortfolioConsent(organizationId, receivableId, issuanceId), /permissão/);
    await assert.rejects(getManagementPortfolio(organizationId, receivableId), /Resposta inválida/);
    assert.equal(calls.filter((call) => call.path.startsWith(route)).length, 3);
  });
});
