import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { listSchedule } from '@/modules/schedule/services/schedule.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const from = new Date('2026-01-01T00:00:00Z'),
  to = new Date('2026-03-05T00:00:00Z');
const item = {
  id: receivableId,
  customerId: issuanceId,
  customerName: 'Fixture',
  title: 'Fixture service',
  serviceAddress: null,
  assignedToId: null,
  assignedToName: null,
  status: 'SCHEDULED',
  scheduledStartAt: '2026-01-03T12:00:00Z',
  scheduledEndAt: '2026-01-03T13:00:00Z',
  startedAt: null,
  version: 1,
  late: false,
};
const filters = { status: 'ALL' as const, assignedToId: null, late: 'ALL' as const };

describe('schedule pagination and range', () => {
  it('splits ranges into at most 31 days, deduplicates overlap and preserves filter identity', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      const url = new URL(call.path, 'https://api.example.invalid');
      const start = url.searchParams.get('from')!,
        end = url.searchParams.get('to')!;

      assert.ok(Date.parse(end) - Date.parse(start) <= 31 * 86400000);

      const page = Number(url.searchParams.get('page'));

      return success({
        items: [item],
        page,
        hasMore: page === 1,
        generatedAt: '2026-01-01T00:00:00Z',
        from: start,
        to: end,
      });
    });

    await restoreSession();
    const first = listSchedule(organizationId, { from, to }, filters);

    assert.strictEqual(first, listSchedule(organizationId, { from, to }, filters));

    const result = await first;

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.id, receivableId);
    assert.equal(calls.filter((call) => call.path.includes('/schedule?')).length, 6);
  });

  it('rejects reversed periods without calling the API', async (t) => {
    const calls = mockHttp(t, () => {
      throw new Error('Unexpected request');
    });

    await assert.rejects(listSchedule(organizationId, { from: to, to: from }, filters), /período da agenda/);
    assert.equal(calls.length, 0);
  });
  for (const [status, message] of [
    [400, /período selecionado/],
    [403, /permissão/],
    [503, /agenda está sendo atualizada/],
    [500, /carregar os agendamentos/],
  ] as const) {
    it('surfaces schedule HTTP ' + status + ' without retrying or retaining a failed flight', async (t) => {
      let failed = true;
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        if (failed) return new Response(null, { status });
        const query = new URLSearchParams(call.path.split('?')[1]);
        return success({
          items: [],
          page: 1,
          hasMore: false,
          generatedAt: from.toISOString(),
          from: query.get('from'),
          to: query.get('to'),
        });
      });
      await restoreSession();
      const range = { from, to: new Date(from.getTime() + 86400000) };
      await assert.rejects(listSchedule(organizationId, range, filters), message);
      failed = false;
      assert.deepEqual((await listSchedule(organizationId, range, filters)).items, []);
      assert.equal(calls.filter((call) => call.path.includes('/schedule?')).length, 2);
    });
  }

  for (const late of ['LATE', 'ON_TIME'] as const) {
    it('encodes assigned user, status and ' + late + ' filter without changing range boundaries', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        const query = new URLSearchParams(call.path.split('?')[1]);
        return success({
          items: [],
          page: 1,
          hasMore: false,
          generatedAt: from.toISOString(),
          from: query.get('from'),
          to: query.get('to'),
        });
      });
      await restoreSession();
      const range = { from, to: new Date(from.getTime() + 86400000) };
      await listSchedule(organizationId, range, { assignedToId: issuanceId, status: 'SCHEDULED', late });
      const request = calls.find((call) => call.path.includes('/schedule?'))!;
      const query = new URLSearchParams(request.path.split('?')[1]);
      assert.equal(query.get('assignedToId'), issuanceId);
      assert.equal(query.get('status'), 'SCHEDULED');
      assert.equal(query.get('late'), late === 'LATE' ? 'true' : 'false');
      assert.equal(query.get('from'), range.from.toISOString());
      assert.equal(query.get('to'), range.to.toISOString());
    });
  }

  it('sorts merged results and selects the latest generation timestamp across chunks', async (t) => {
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      const query = new URLSearchParams(call.path.split('?')[1]);
      const start = query.get('from')!;
      const first = start === from.toISOString();
      return success({
        items: first
          ? [
              { ...item, scheduledStartAt: '2026-01-04T12:00:00Z', scheduledEndAt: '2026-01-04T13:00:00Z' },
              {
                ...item,
                id: issuanceId,
                scheduledStartAt: '2026-01-02T12:00:00Z',
                scheduledEndAt: '2026-01-02T13:00:00Z',
              },
            ]
          : [],
        page: 1,
        hasMore: false,
        generatedAt: first ? '2026-01-01T00:00:00Z' : '2026-01-02T00:00:00Z',
        from: start,
        to: query.get('to'),
      });
    });
    await restoreSession();
    const result = await listSchedule(organizationId, { from, to }, filters);
    assert.deepEqual(
      result.items.map((entry) => entry.id),
      [issuanceId, receivableId],
    );
    assert.equal(result.generatedAt.toISOString(), '2026-01-02T00:00:00.000Z');
  });

  it('rejects malformed response data instead of displaying partial agenda results', async (t) => {
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ items: 'invalid' });
    });
    await restoreSession();
    await assert.rejects(
      listSchedule(organizationId, { from, to: new Date(from.getTime() + 86400000) }, filters),
      /interpretar/,
    );
  });
});
