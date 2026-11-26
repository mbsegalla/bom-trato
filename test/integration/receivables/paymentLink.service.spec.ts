import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveReceivablePaymentLink } from '@/modules/receivables/services/receivablePaymentLink.service';
import { mockHttp, success } from '../../support/http.fixture';

const token = 'a'.repeat(64);
const route = '/api/public/receivable-payment-links/resolve';
const code = '000201FIXTURE6304ABCD';

describe('public payment link HTTP service', () => {
  it('rejects malformed tokens before network access', async (t) => {
    const calls = mockHttp(t, () => {
      throw new Error('Unexpected request');
    });

    await assert.rejects(resolveReceivablePaymentLink('invalid'), /indisponível/);
    assert.equal(calls.length, 0);
  });

  it('uses a POST body, omits credentials and rejects expired or invalid QR responses', async (t) => {
    let expiresAt = new Date(Date.now() + 600000).toISOString();
    let copyAndPaste = code;
    const calls = mockHttp(t, (call) => {
      assert.equal(call.path, route);

      return success({
        organizationName: 'Fixture',
        merchantName: 'TEST',
        amountInCents: 100,
        currency: 'brl',
        copyAndPaste,
        expiresAt
      });
    });

    assert.equal((await resolveReceivablePaymentLink(token)).copyAndPaste, code);
    assert.equal(calls[0].method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[0].body)), { token });
    assert.equal(calls[0].credentials, 'omit');
    assert.equal(calls[0].cache, 'no-store');
    assert.equal(calls[0].headers.get('Authorization'), null);

    expiresAt = new Date(Date.now() - 1000).toISOString();

    await assert.rejects(resolveReceivablePaymentLink(token), /indisponível/);

    expiresAt = new Date(Date.now() + 600000).toISOString();
    copyAndPaste = 'invalid';

    await assert.rejects(resolveReceivablePaymentLink(token), /indisponível/);
  });

  it('reports rate limits without retrying a private link automatically', async (t) => {
    const calls = mockHttp(t, () => new Response(null, { status: 429 }));

    await assert.rejects(resolveReceivablePaymentLink(token), /Muitas tentativas/);
    assert.equal(calls.length, 1);
  });
});
