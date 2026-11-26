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
  for (const [status, message] of [
    [400, /CEP ou estado válido/], [502, /temporariamente indisponível/], [503, /temporariamente indisponível/],
    [500, /consultar o CEP/],
  ] as const) {
    it('surfaces CEP provider HTTP ' + status + ' without caching the failure', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status });
      });
      await restoreSession();
      await assert.rejects(findAddressByPostalCode('38400-000'), message);
      await assert.rejects(findAddressByPostalCode('38400000'), message);
      assert.equal(calls.filter((call) => call.path.endsWith('/38400000')).length, 2);
    });
  }

  it('rejects malformed postal code and city payloads and permits a new explicit city request', async (t) => {
    let fail = true;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.includes('/postal-codes/')) return success({ invalid: true });
      return fail ? success([{ code: 'invalid', name: 42 }]) : success([{ code: '4106902', name: 'Curitiba' }]);
    });
    await restoreSession();
    await assert.rejects(findAddressByPostalCode('80000000'), /interpretar/);
    await assert.rejects(listBrazilianCities('PR'), /interpretar/);
    fail = false;
    assert.equal((await listBrazilianCities(' pr '))[0]?.name, 'Curitiba');
    assert.equal((await listBrazilianCities('PR'))[0]?.name, 'Curitiba');
    assert.equal(calls.filter((call) => call.path.includes('/PR/cities')).length, 2);
  });

  it('rejects expired authentication for postal codes and uncached cities', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: 401 });
    });
    await restoreSession();
    await assert.rejects(findAddressByPostalCode('70000000'), /sessão expirou/);
    await assert.rejects(listBrazilianCities('DF'), /sessão expirou/);
    assert.equal(calls.filter((call) => call.path.startsWith('/api/address/')).length, 4);
  });

  it('rejects failed city lookup without populating the state cache', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: 502 });
    });
    await restoreSession();
    await assert.rejects(listBrazilianCities('SC'), /temporariamente indisponível/);
    await assert.rejects(listBrazilianCities('SC'), /temporariamente indisponível/);
    assert.equal(calls.filter((call) => call.path.includes('/SC/cities')).length, 2);
  });
});
