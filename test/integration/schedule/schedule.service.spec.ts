import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { listSchedule } from '@/modules/schedule/services/schedule.service';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';
const from = new Date('2026-01-01T00:00:00Z'), to = new Date('2026-03-05T00:00:00Z');
const item = { id: receivableId, customerId: issuanceId, customerName: 'Fixture', title: 'Fixture service', serviceAddress: null, assignedToId: null, assignedToName: null, status: 'SCHEDULED', scheduledStartAt: '2026-01-03T12:00:00Z', scheduledEndAt: '2026-01-03T13:00:00Z', startedAt: null, version: 1, late: false };
const filters = { status: 'ALL' as const, assignedToId: null, late: 'ALL' as const };
describe('schedule pagination and range', () => {
  it('splits ranges into at most 31 days, deduplicates overlap and preserves filter identity', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      const url = new URL(call.path, 'https://api.example.invalid');
      const start = url.searchParams.get('from')!, end = url.searchParams.get('to')!;
      assert.ok(Date.parse(end) - Date.parse(start) <= 31 * 86400000);
      const page = Number(url.searchParams.get('page'));
      return success({ items: [item], page, hasMore: page === 1, generatedAt: '2026-01-01T00:00:00Z', from: start, to: end });
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
    const calls = mockHttp(t, () => { throw new Error('Unexpected request'); });
    await assert.rejects(listSchedule(organizationId, { from: to, to: from }, filters), /período da agenda/);
    assert.equal(calls.length, 0);
  });
});
