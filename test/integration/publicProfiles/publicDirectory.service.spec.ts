import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getPublicProfessional,
  getPublicProfessionals,
  getPublicWhatsappUrl,
  PublicDirectoryError,
} from '@/modules/publicProfiles/services/publicDirectory.service';

import { mockHttp, success } from '../../support/http.fixture';

describe('public directory HTTP service', () => {
  it('normalizes and encodes search and location filters without attaching credentials', async (t) => {
    const calls = mockHttp(t, () => success({ items: [], page: 2, hasMore: false }));

    assert.deepEqual(
      await getPublicProfessionals({
        page: 2,
        limit: 10,
        search: ' Reparo & Instalacao ',
        city: ' Uberlandia ',
        state: ' mg ',
      }),
      {
        items: [],
        page: 2,
        hasMore: false,
      },
    );

    const url = new URL(calls[0]!.path, 'https://api.example.invalid');

    assert.equal(url.pathname, '/api/public/professionals');
    assert.equal(url.searchParams.get('search'), 'Reparo & Instalacao');
    assert.equal(url.searchParams.get('city'), 'Uberlandia');
    assert.equal(url.searchParams.get('state'), 'MG');
    assert.equal(calls[0]?.headers.has('Authorization'), false);
    assert.equal(new URL(getPublicWhatsappUrl('fixture')).pathname, '/api/public/professionals/fixture/whatsapp');
  });

  it('distinguishes a missing public profile from a malformed upstream response', async (t) => {
    let missing = true;
    mockHttp(t, () => (missing ? new Response(null, { status: 404 }) : success({ slug: 'fixture' })));

    await assert.rejects(
      getPublicProfessional('fixture'),
      (error: unknown) => error instanceof PublicDirectoryError && error.status === 404,
    );

    missing = false;

    await assert.rejects(
      getPublicProfessional('fixture'),
      (error: unknown) => error instanceof PublicDirectoryError && error.status === 0,
    );
  });
});
