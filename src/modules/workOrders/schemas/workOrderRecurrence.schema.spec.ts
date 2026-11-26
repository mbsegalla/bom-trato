import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { workOrderRecurrenceFormSchema } from './workOrderRecurrence.schema';

const input = {
  intervalUnit: 'MONTH',
  intervalCount: 12,
  nextVisitOn: '2028-02-29',
  enabled: true
};

describe('work order recurrence form', () => {
  it('enforces unit-specific limits and does not implicitly opt into generation', () => {
    assert.equal(workOrderRecurrenceFormSchema.parse(input).autoGenerateEnabled, undefined);

    for (const patch of [
      { intervalCount: 13 },
      { intervalCount: 0 },
      {
        intervalUnit: 'WEEK',
        intervalCount: 53
      },
      {
        intervalUnit: 'DAY',
        intervalCount: 366
      }
    ]) assert.equal(workOrderRecurrenceFormSchema.safeParse({ ...input, ...patch }).success, false);
  });

  it('rejects impossible calendar dates and accepts leap days', () => {
    assert.equal(workOrderRecurrenceFormSchema.safeParse(input).success, true);
    assert.equal(workOrderRecurrenceFormSchema.safeParse({ ...input, nextVisitOn: '2027-02-29' }).success, false);
  });
});
