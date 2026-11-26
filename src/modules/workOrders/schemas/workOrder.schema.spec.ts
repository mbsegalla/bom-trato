import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  workOrderCancelFormSchema,
  workOrderExecutionNotesFormSchema,
  workOrderPlanningFormSchema,
  workOrderScheduleFormSchema,
  workOrderReviewDeliverySchema,
} from './workOrder.schema';

describe('work order form boundaries', () => {
  it('trims planning fields and normalizes empty optional values to null', () => {
    assert.deepEqual(workOrderPlanningFormSchema.parse({
      title: '  Fixture service  ',
      instructions: '  ',
      serviceAddress: '  Fixture address  ',
    }), {
      title: 'Fixture service',
      instructions: null,
      serviceAddress: 'Fixture address',
    });
    assert.equal(workOrderPlanningFormSchema.safeParse({ title: 'A', instructions: '', serviceAddress: '' }).success, false);
  });

  it('rejects invalid or past schedule dates and nonpositive scheduling intervals', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    const future = new Date(Date.now() + 3600000).toISOString();

    for (const value of [
      { scheduledStartAt: 'invalid', scheduledEndAt: future },
      { scheduledStartAt: past, scheduledEndAt: future },
      { scheduledStartAt: future, scheduledEndAt: future },
      { scheduledStartAt: future, scheduledEndAt: past },
    ]) {
      assert.equal(workOrderScheduleFormSchema.safeParse(value).success, false);
    }
  });

  it('normalizes valid schedule instants to ISO and preserves their duration', () => {
    const start = new Date(Date.now() + 3600000);
    const end = new Date(start.getTime() + 5400000);
    const result = workOrderScheduleFormSchema.parse({
      scheduledStartAt: start.toISOString(),
      scheduledEndAt: end.toISOString(),
    });

    assert.equal(result.scheduledStartAt, start.toISOString());
    assert.equal(result.scheduledEndAt, end.toISOString());
  });

  it('normalizes execution notes and requires a meaningful cancellation reason', () => {
    assert.deepEqual(workOrderExecutionNotesFormSchema.parse({ executionNotes: '   ' }), { executionNotes: null });
    assert.deepEqual(workOrderExecutionNotesFormSchema.parse({ executionNotes: '  Fixture completed  ' }), { executionNotes: 'Fixture completed' });
    assert.equal(workOrderCancelFormSchema.safeParse({ reason: ' abc ' }).success, false);
    assert.deepEqual(workOrderCancelFormSchema.parse({ reason: '  Fixture reason  ' }), { reason: 'Fixture reason' });
  });

  it('requires an email recipient with no token for email delivery and a token for WhatsApp delivery', () => {
    const base = { organizationName: 'Fixture organization' };

    assert.equal(workOrderReviewDeliverySchema.safeParse({
      ...base, channel: 'EMAIL', recipient: 'fixture@example.invalid', token: null,
    }).success, true);
    assert.equal(workOrderReviewDeliverySchema.safeParse({
      ...base, channel: 'EMAIL', recipient: 'fixture@example.invalid', token: 'private',
    }).success, false);
    assert.equal(workOrderReviewDeliverySchema.safeParse({
      ...base, channel: 'WHATSAPP', recipient: '34999991234', token: 'fixture',
    }).success, true);
    assert.equal(workOrderReviewDeliverySchema.safeParse({
      ...base, channel: 'WHATSAPP', recipient: '34999991234', token: null,
    }).success, false);
  });
});
