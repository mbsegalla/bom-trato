import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  decidePublicQuote,
  requestPublicQuoteChange,
  resolvePublicQuote
} from '@/modules/quotes/services/quote.service';
import { mockHttp, success } from '../../support/http.fixture';

const token = 'a'.repeat(64);

describe('public quote HTTP decisions', () => {
  it('rejects a malformed quote link before accessing the API', async (t) => {
    const calls = mockHttp(t, () => {
      throw new Error('Unexpected request');
    });

    await assert.rejects(resolvePublicQuote('invalid'), /inválido/);
    assert.equal(calls.length, 0);
  });

  it('keeps private link tokens in the request body and sends the exact quote version', async (t) => {
    const decidedAt = '2026-01-01T00:00:00Z';
    const calls = mockHttp(t, (call) => call.path.endsWith('/change-request')
      ? success({ requestedAt: decidedAt })
      : success({ status: 'APPROVED', decidedAt, version: 3 }));

    assert.deepEqual(
      await decidePublicQuote(token, 2, 'approve'),
      {
        status: 'APPROVED',
        decidedAt: new Date(decidedAt),
        version: 3
      }
    );
    assert.deepEqual(await requestPublicQuoteChange(token, 2, 'Alterar data'), { requestedAt: new Date(decidedAt) });
    assert.deepEqual(
      calls.map((call) => call.path),
      [
        '/api/public/quotes/approve',
        '/api/public/quotes/change-request'
      ]
    );
    assert.deepEqual(
      calls.map((call) => JSON.parse(String(call.body))),
      [
        { token, version: 2 },
        {
          token,
          version: 2,
          message: 'Alterar data'
        }
      ]
    );
    assert.ok(calls.every((call) => call.method === 'POST' && call.cache === 'no-store' && !call.headers.has('Authorization')));
  });

  it('does not retry conflicting or malformed decision responses', async (t) => {
    let conflict = true;
    const calls = mockHttp(t, () => conflict ? new Response(null, { status: 409 }) : success({ status: 'SENT', version: 1 }));

    await assert.rejects(decidePublicQuote(token, 1, 'decline'), /alterado ou decidido/);

    conflict = false;

    await assert.rejects(decidePublicQuote(token, 1, 'decline'), /interpretar/);
    assert.equal(calls.length, 2);
  });
});
