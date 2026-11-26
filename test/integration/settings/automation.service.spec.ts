import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { listAutomationEvents } from '@/modules/settings/services/automation.service';
import {
  mockHttp,
  organizationId,
  receivableId,
  issuanceId,
  sessionResponse,
  success
} from '../../support/http.fixture';

const event = {
  id: issuanceId,
  type: 'RECEIVABLE_OVERDUE',
  entityType: 'RECEIVABLE',
  entityId: receivableId,
  description: 'Fixture reminder',
  href: '/receivables/' + receivableId,
  status: 'SKIPPED',
  availableAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  finishedAt: '2026-01-01T00:00:00Z',
  lastErrorCode: null
};

describe('automation history contract', () => {
  it('reads a scoped history without confusing skipped actions with successful sends', async (t) => {
    let status = 'SKIPPED';
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return success({ items: [{ ...event, status }] });
    });

    await restoreSession();
    const events = await listAutomationEvents(organizationId);

    assert.equal(events[0]?.status, 'SKIPPED');
    assert.ok(events[0]?.createdAt instanceof Date);

    status = 'UNKNOWN';

    await assert.rejects(listAutomationEvents(organizationId), /interpretar/);
    assert.equal(
      calls.at(-1)?.path,
      '/api/organizations/' + organizationId + '/notifications/automation-events?limit=20'
    );
  });
});
