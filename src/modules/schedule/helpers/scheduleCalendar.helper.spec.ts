import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { changeMonth, dateKey, getCalendarDays, getMonthRange } from './scheduleCalendar.helper';

describe('schedule calendar', () => {
  it('rolls months across year boundaries using local calendar dates', () => {
    assert.equal(dateKey(changeMonth(new Date(2026, 11, 31), 1)), '2027-01-01');
    const range = getMonthRange(new Date(2028, 1, 15));
    assert.equal(dateKey(range.from), '2028-02-01');
    assert.equal(dateKey(range.to), '2028-03-01');
  });
  it('uses full Monday-first calendar weeks and includes all leap days', () => {
    const days = getCalendarDays(new Date(2028, 1, 1));
    assert.equal(days.length % 7, 0);
    assert.equal(days[0].date.getDay(), 1);
    assert.equal(days.filter((day) => day.currentMonth).length, 29);
  });
});
