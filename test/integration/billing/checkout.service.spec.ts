import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { startCheckout } from '@/modules/billing/services/checkout.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const result = { attemptId: issuanceId, clientSecret: 'fixture-secret' };

describe('subscription checkout HTTP service', () => {
  it('coalesces identical checkout requests without mixing organizations or plan prices', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return success(result);
    });

    await restoreSession();
    const first = startCheckout(organizationId, 'price-a');

    assert.strictEqual(first, startCheckout(organizationId, 'price-a'));

    await Promise.all([first, startCheckout(receivableId, 'price-a'), startCheckout(organizationId, 'price-b')]);
    const requests = calls.filter((call) => call.path.endsWith('/billing/checkout'));

    assert.equal(requests.length, 3);
    assert.ok(requests.some((call) => call.path.includes(receivableId)));
    assert.deepEqual(requests.map((call) => JSON.parse(String(call.body)).planPriceId).sort(), [
      'price-a',
      'price-a',
      'price-b',
    ]);
    assert.ok(requests.every((call) => call.method === 'POST'));
  });

  it('clears rejected checkout flights without automatic repeated POST and rejects malformed success data', async (t) => {
    let attempts = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      attempts++;
      if (attempts === 1) return new Response(null, { status: 409 });
      if (attempts === 2) return success({ ...result, clientSecret: '' });

      return success(result);
    });

    await restoreSession();

    await assert.rejects(startCheckout(organizationId, 'price-a'), /operação de pagamento em andamento/);
    await assert.rejects(startCheckout(organizationId, 'price-a'), /interpretar/);
    assert.deepEqual(await startCheckout(organizationId, 'price-a'), result);
    assert.equal(calls.filter((call) => call.path.endsWith('/billing/checkout')).length, 3);
  });
  for (const [status, message] of [
    [400, /dados do pagamento são inválidos/],
    [403, /permissão/],
    [404, /encontrar o negócio/],
    [429, /Muitas tentativas/],
    [503, /pagamento está sendo preparado/],
    [500, /iniciar o pagamento/],
  ] as const) {
    it('maps checkout failure ' + status + ' and releases the flight', async (t) => {
      let fail = true;
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return fail ? new Response(null, { status }) : success(result);
      });
      await restoreSession();
      await assert.rejects(startCheckout(organizationId, 'price-a'), message);
      fail = false;
      assert.deepEqual(await startCheckout(organizationId, 'price-a'), result);
      assert.equal(calls.filter((call) => call.path.endsWith('/billing/checkout')).length, 2);
    });
  }

  it('surfaces expired authentication after exactly one replay', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: 401 });
    });
    await restoreSession();
    await assert.rejects(startCheckout(organizationId, 'price-a'), /sessão expirou/);
    assert.equal(calls.filter((call) => call.path.endsWith('/billing/checkout')).length, 2);
  });
});
