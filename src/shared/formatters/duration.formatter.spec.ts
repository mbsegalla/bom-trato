import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatDurationMinutes } from './duration.formatter';

describe('service duration formatting', () => {
  it('distinguishes an absent duration from a positive number of minutes', () => {
    assert.equal(formatDurationMinutes(null), 'Não informada');
    assert.equal(formatDurationMinutes(1), '1min');
    assert.equal(formatDurationMinutes(59), '59min');
  });

  it('keeps exact hours and mixed minutes without redundant zero units', () => {
    assert.equal(formatDurationMinutes(60), '1h');
    assert.equal(formatDurationMinutes(125), '2h 5min');
  });

  it('formats multi-day service durations with singular and plural days', () => {
    assert.equal(formatDurationMinutes(1440), '1 dia');
    assert.equal(formatDurationMinutes(2945), '2 dias 1h 5min');
  });
});
