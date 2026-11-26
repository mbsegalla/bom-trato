import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addMonths,
  buildCalendarDays,
  formatDatePickerDisplay,
  formatDatePickerValue,
  formatMonthYear,
  isCalendarDayDisabled,
  isDateTimeWithinLimits,
  isSameDay,
  isSameMonth,
  parseDatePickerValue,
  roundUpToMinuteStep,
  toMinutePrecision,
} from './datePicker.helper';

describe('date picker calendar rules', () => {
  it('round trips local date-time values without a UTC date shift', () => {
    const value = parseDatePickerValue('2028-02-29T23:45', 'datetime');

    assert.ok(value);
    assert.equal(formatDatePickerValue(value, 'datetime'), '2028-02-29T23:45');
    assert.equal(formatDatePickerValue(value, 'date'), '2028-02-29');
  });

  it('rejects invalid calendar and clock values without normalizing them into another date', () => {
    for (const date of ['2027-02-29', '2028-04-31', '2028-13-01', '2028-01-00', '2028-01-01T00:00'])
      assert.equal(parseDatePickerValue(date, 'date'), null);
    for (const date of ['2028-01-01T24:00', '2028-01-01T10:60', '2028-01-01T10:30Z'])
      assert.equal(parseDatePickerValue(date, 'datetime'), null);
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
      '2028-03-01T00:00',
    );
    assert.equal(
      formatDatePickerValue(roundUpToMinuteStep(new Date(2028, 1, 29, 12, 30), 15), 'datetime'),
      '2028-02-29T12:30',
    );
  });
  it('rejects missing values and accepts a valid local date at midnight', () => {
    assert.equal(parseDatePickerValue(undefined, 'date'), null);
    assert.equal(parseDatePickerValue('', 'datetime'), null);
    const value = parseDatePickerValue('2028-02-29', 'date');
    assert.ok(value);
    assert.equal(value.getHours(), 0);
    assert.equal(value.getMinutes(), 0);
    assert.equal(formatDatePickerValue(value, 'date'), '2028-02-29');
  });

  it('formats local display dates without converting to UTC', () => {
    const date = new Date(2028, 1, 29, 9, 5);
    assert.equal(formatDatePickerDisplay(date, 'date'), '29/02/2028');
    assert.match(formatDatePickerDisplay(date, 'datetime'), /29\/02\/2028.*09:05/);
    assert.equal(formatMonthYear(date), 'Fevereiro de 2028');
  });

  it('compares calendar days independently of time and rejects distinct years or months', () => {
    const date = new Date(2028, 1, 29, 9);
    assert.equal(isSameDay(date, new Date(2028, 1, 29, 18)), true);
    assert.equal(isSameDay(date, new Date(2028, 1, 28)), false);
    assert.equal(isSameDay(date, new Date(2028, 2, 29)), false);
    assert.equal(isSameDay(date, new Date(2027, 1, 28)), false);
    assert.equal(isSameMonth(date, new Date(2028, 1, 1)), true);
    assert.equal(isSameMonth(date, new Date(2028, 2, 1)), false);
    assert.equal(isSameMonth(date, new Date(2027, 1, 1)), false);
  });

  it('treats day and instant boundaries as inclusive with optional minimum and maximum', () => {
    const min = new Date(2028, 1, 10, 9);
    const max = new Date(2028, 1, 12, 17);
    assert.equal(isCalendarDayDisabled(new Date(2028, 1, 9), min, max), true);
    assert.equal(isCalendarDayDisabled(new Date(2028, 1, 13), min, max), true);
    assert.equal(isCalendarDayDisabled(new Date(2028, 1, 12, 23), undefined, max), false);
    assert.equal(isCalendarDayDisabled(min), false);
    assert.equal(isDateTimeWithinLimits(min, min, max), true);
    assert.equal(isDateTimeWithinLimits(max, min, max), true);
    assert.equal(isDateTimeWithinLimits(new Date(max.getTime() + 1), undefined, max), false);
    assert.equal(isDateTimeWithinLimits(min), true);
  });

  it('rounds an aligned minute with seconds or milliseconds up and never mutates the input', () => {
    const source = new Date(2028, 1, 29, 12, 30, 0, 1);
    assert.equal(formatDatePickerValue(roundUpToMinuteStep(source, 15), 'datetime'), '2028-02-29T12:45');
    assert.equal(source.getMilliseconds(), 1);
    const precise = toMinutePrecision(source);
    assert.notStrictEqual(precise, source);
    assert.equal(precise.getMilliseconds(), 0);
    assert.equal(precise.getSeconds(), 0);
    assert.equal(precise.getMinutes(), 30);
  });
});
