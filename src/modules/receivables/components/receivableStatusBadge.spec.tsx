import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import { ReceivableStatusBadge } from './receivableStatusBadge';

describe('ReceivableStatusBadge', () => {
  it('shows overdue for open balances but never for paid or canceled payments', () => {
    assert.match(renderToStaticMarkup(<ReceivableStatusBadge status="OPEN" overdue />), /Em atraso/);
    assert.match(renderToStaticMarkup(<ReceivableStatusBadge status="PAID" overdue />), />Pago</);
    assert.match(renderToStaticMarkup(<ReceivableStatusBadge status="CANCELED" overdue />), />Cancelado</);
    assert.doesNotMatch(renderToStaticMarkup(<ReceivableStatusBadge status="PAID" overdue />), /Em atraso/);
  });
});
