import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addMonths,
  buildCalendarDays,
  formatDatePickerValue,
  isCalendarDayDisabled,
  isDateTimeWithinLimits,
  parseDatePickerValue,
  roundUpToMinuteStep
} from './datePicker.helper';

describe('date picker calendar rules', () => {
  it('round trips local date-time values without a UTC date shift', () => {
    const value = parseDatePickerValue('2028-02-29T23:45', 'datetime');

    assert.ok(value);
    assert.equal(formatDatePickerValue(value, 'datetime'), '2028-02-29T23:45');
    assert.equal(formatDatePickerValue(value, 'date'), '2028-02-29');
  });

  it('rejects invalid calendar and clock values without normalizing them into another date', () => {
    for (const date of [
      '2027-02-29',
      '2028-04-31',
      '2028-13-01',
      '2028-01-00',
      '2028-01-01T00:00'
    ]) assert.equal(parseDatePickerValue(date, 'date'), null);
    for (const date of [
      '2028-01-01T24:00',
      '2028-01-01T10:60',
      '2028-01-01T10:30Z'
    ]) assert.equal(parseDatePickerValue(date, 'datetime'), null);
  });

  it('builds six complete calendar weeks and handles year boundaries', () => {
    const days = buildCalendarDays(new Date(2028, 1, 15));

    assert.equal(days.length, 42);
    assert.equal(days[0]!.getDay(), 0);
    assert.equal(days.filter((day) => day.getMonth() === 1).length, 29);
    assert.equal(formatDatePickerValue(addMonths(new Date(2028, 11, 31), 1), 'date'), '2029-01-01');
  });

  it('distinguishes whole-day limits from time limits and rounds up across midnight', () => {
    const min = new Date(2028, 1, 29, 12);
    const sameDay = new Date(2028, 1, 29, 10);

    assert.equal(isCalendarDayDisabled(sameDay, min), false);
    assert.equal(isDateTimeWithinLimits(sameDay, min), false);
    assert.equal(
      formatDatePickerValue(roundUpToMinuteStep(new Date(2028, 1, 29, 23, 59, 30), 15), 'datetime'),
      '2028-03-01T00:00'
    );
    assert.equal(
      formatDatePickerValue(roundUpToMinuteStep(new Date(2028, 1, 29, 12, 30), 15), 'datetime'),
      '2028-02-29T12:30'
    );
  });
});
