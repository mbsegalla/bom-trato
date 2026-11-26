import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatDate,
  formatDateInput,
  formatDateTime,
  formatDateTimeLocalInput,
  formatLongDate,
  formatMonthYear,
  formatRelativeDateTime,
  formatShortDate,
  formatTime,
  formatWeekday,
} from './date.formatter';

describe('Brazilian date formatters', () => {
  it('preserves local calendar fields in form values independently of timezone', () => {
    const date = new Date(2026, 0, 5, 13, 7, 42);

    assert.equal(formatDateInput(date), '2026-01-05');
    assert.equal(formatDateTimeLocalInput(date), '2026-01-05T13:07');
    assert.equal(formatDateTimeLocalInput(null), '');
    assert.equal(formatDate(date), '05/01/2026');
    assert.equal(formatShortDate(date), '05/01');
    assert.equal(formatTime(date), '13:07');
  });

  it('supports absent values and explicit fallbacks', () => {
    assert.equal(formatDate(null), 'Sem data');
    assert.equal(formatShortDate(null, 'Nenhuma'), 'Nenhuma');
    assert.equal(formatTime(null), 'A definir');
    assert.equal(formatDateTime(null, 'Indefinida'), 'Indefinida');
  });

  it('formats weekday and month names in Portuguese', () => {
    const date = new Date(2026, 0, 5, 13, 7);

    assert.match(formatLongDate(date), /segunda-feira/);
    assert.match(formatMonthYear(date), /janeiro.*2026/);
    assert.equal(formatWeekday(date), 'segunda-feira');
  });

  it('switches relative units and falls back to an absolute date for older events', () => {
    const now = new Date(2026, 0, 15, 12, 0);
    const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    const offset = (milliseconds: number) => new Date(now.getTime() + milliseconds);

    assert.equal(formatRelativeDateTime(offset(-30_000), now), relative.format(-30, 'second'));
    assert.equal(formatRelativeDateTime(offset(120_000), now), relative.format(2, 'minute'));
    assert.equal(formatRelativeDateTime(offset(-3 * 3600000), now), relative.format(-3, 'hour'));
    assert.equal(formatRelativeDateTime(offset(2 * 86400000), now), relative.format(2, 'day'));

    const older = offset(-8 * 86400000);

    assert.equal(formatRelativeDateTime(older, now), formatDateTime(older));
  });
});
