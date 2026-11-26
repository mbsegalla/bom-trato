import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createQuoteWhatsAppMessage, createQuoteWhatsAppUrl } from './quoteWhatsapp.helper';
import type { Quote } from '../types/quote.types';

describe('quote WhatsApp sharing', () => {
  it('encodes the exact amount and private link, without changing the recipient', () => {
    const quote = {
      customerName: 'Cliente Teste',
      title: 'Revisao',
      totalInCents: 123456
    } as Quote;
    const link = 'https://web.example.invalid/quote-share#token=' + 'a'.repeat(64);
    const message = createQuoteWhatsAppMessage(quote, link);

    assert.match(message, /1\.234,56/);
    assert.ok(message.includes(link));

    const url = new URL(createQuoteWhatsAppUrl('+55 (34) 99999-1234', message));

    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, '/5534999991234');
    assert.equal(url.searchParams.get('text'), message);
    assert.equal(new URL(createQuoteWhatsAppUrl('123', message)).pathname, '/');
  });
});
