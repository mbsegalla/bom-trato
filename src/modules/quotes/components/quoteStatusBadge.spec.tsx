import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { QuoteStatusBadge } from './quoteStatusBadge';

describe('QuoteStatusBadge', () => {
  it('shows expiration only for a sent quote', () => {
    const past = new Date('2000-01-01T00:00:00Z');

    assert.match(renderToStaticMarkup(<QuoteStatusBadge status="SENT" validUntil={past} />), /Expirado/);
    assert.match(renderToStaticMarkup(<QuoteStatusBadge status="APPROVED" validUntil={past} />), /Aprovado/);
  });
});
