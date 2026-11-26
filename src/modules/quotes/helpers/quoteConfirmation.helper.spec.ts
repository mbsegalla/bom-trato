import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getQuoteConfirmationContent } from './quoteConfirmation.helper';
import type { QuoteItem } from '../types/quote.types';

describe('quote confirmations', () => {
  it('distinguishes recording a customer approval from destructive decisions', () => {
    assert.equal(getQuoteConfirmationContent(null), null);
    assert.equal(getQuoteConfirmationContent({ kind: 'APPROVE' })?.destructive, false);
    assert.match(getQuoteConfirmationContent({ kind: 'APPROVE' })!.description, /outro canal/);
    assert.equal(getQuoteConfirmationContent({ kind: 'DECLINE' })?.destructive, true);
    assert.equal(getQuoteConfirmationContent({ kind: 'CANCEL' })?.destructive, true);
    const item = { name: 'Fixture item' } as QuoteItem;
    assert.match(getQuoteConfirmationContent({ kind: 'REMOVE_ITEM', item })!.description, /Fixture item/);
  });
});
