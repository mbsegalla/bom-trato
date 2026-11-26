import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatBrlCurrency,
  formatBrlCurrencyInput,
  formatBrlCurrencyInputValue,
  formatCompactBrlCurrency,
} from './currency.formatter';

describe('BRL currency formatters', () => {
  it('converts integer cents into Brazilian currency without confusing cents and reais', () => {
    assert.equal(formatBrlCurrency(123456).replace(/\s/g, ' '), 'R$ 1.234,56');
    assert.equal(formatBrlCurrencyInput(1), '0,01');
    assert.equal(formatBrlCurrencyInput(0), '0,00');
    assert.equal(formatBrlCurrencyInput(-120), '-1,20');
  });

  it('keeps compact amounts in Brazilian currency', () => {
    const result = formatCompactBrlCurrency(120000);

    assert.match(result, /R\$/);
    assert.match(result, /1,2\s*mil/);
  });

  it('normalizes localized input while preserving empty or unparseable input', () => {
    assert.equal(formatBrlCurrencyInputValue(' 1.234,5 '), '1.234,50');
    assert.equal(formatBrlCurrencyInputValue('R$ 12,3'), '12,30');
    assert.equal(formatBrlCurrencyInputValue('  '), '');
    assert.equal(formatBrlCurrencyInputValue(','), ',');
  });
});
