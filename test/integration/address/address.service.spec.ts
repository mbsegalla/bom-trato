import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  findAddressByPostalCode,
  listBrazilianCities,
  listBrazilianStates
} from '@/modules/address/services/address.service';
import { mockHttp, sessionResponse, success } from '../../support/http.fixture';

describe('address HTTP service', () => {
  it('coalesces normalized CEP requests and reports provider errors without caching failure', async (t) => {
    let fail = true;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return fail ? new Response(null, { status: 404 }) : success({
        postalCode: '01001000',
        street: null,
        neighborhood: null,
        city: 'Sao Paulo',
        state: 'SP',
        cityIbgeCode: null,
        stateIbgeCode: null
      });
    });

    await restoreSession();
    const first = findAddressByPostalCode('01001-000');

    assert.strictEqual(first, findAddressByPostalCode('01001000'));
    await assert.rejects(first, /CEP não encontrado/);

    fail = false;

    assert.equal((await findAddressByPostalCode('01001000')).state, 'SP');
    assert.equal(calls.filter((call) => call.path === '/api/address/postal-codes/01001000').length, 2);
  });

  it('caches states and separates municipalities by normalized state', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/address/states') return success([{ code: 'MG', name: 'Minas Gerais' }]);
      if (call.path.includes('/MG/')) return success([{ code: '3170206', name: 'Uberlandia' }]);
      if (call.path.includes('/SP/')) return success([{ code: '3550308', name: 'Sao Paulo' }]);
      throw new Error('Unexpected request');
    });

    await restoreSession();
    await listBrazilianStates();
    await listBrazilianStates();
    const first = listBrazilianCities(' mg ');

    assert.strictEqual(first, listBrazilianCities('MG'));

    const [mg, sp] = await Promise.all([first, listBrazilianCities('SP')]);

    assert.equal(mg[0]?.name, 'Uberlandia');
    assert.equal(sp[0]?.name, 'Sao Paulo');
    assert.equal(calls.filter((call) => call.path.startsWith('/api/address/')).length, 3);
  });
});
