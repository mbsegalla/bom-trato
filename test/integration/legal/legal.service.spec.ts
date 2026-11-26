import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getCurrentLegalDocuments } from '@/modules/legal/services/legal.service';

import { mockHttp, success } from '../../support/http.fixture';

describe('legal document retrieval', () => {
  it('fetches current legal versions without cached or authenticated data', async (t) => {
    const terms = {
      version: 'fixture-terms',
      effectiveAt: '2026-01-01T00:00:00Z',
      path: '/terms',
    };
    const privacy = { ...terms, version: 'fixture-privacy', path: '/privacy' };
    const calls = mockHttp(t, () => success({ terms, privacy }));

    const result = await getCurrentLegalDocuments();

    assert.equal(result.success, true);
    assert.equal(calls[0]?.path, '/api/legal/current');
    assert.equal(calls[0]?.cache, 'no-store');
    assert.equal(calls[0]?.headers.has('Authorization'), false);
  });

  it('fails closed if one legal document is missing or the transport fails', async (t) => {
    let fail = false;
    mockHttp(t, () => {
      if (fail) throw new Error('transport failure');

      return success({
        terms: {
          version: 'fixture',
          effectiveAt: '2026-01-01T00:00:00Z',
          path: '/terms',
        },
      });
    });

    assert.equal((await getCurrentLegalDocuments()).success, false);

    fail = true;

    assert.equal((await getCurrentLegalDocuments()).success, false);
  });
});
