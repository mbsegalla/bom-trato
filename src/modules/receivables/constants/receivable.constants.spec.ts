import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canEditReceivable,
  canRecordReceivablePayment,
  getReceivableKindLabel,
  getReceivablePaymentMethodLabel,
  getReceivableStatusLabel,
} from './receivable.constants';

describe('receivable presentation policies', () => {
  it('permits financial operations only on open or partially paid receivables', () => {
    for (const status of ['OPEN', 'PARTIALLY_PAID'] as const) {
      assert.equal(canEditReceivable(status), true);
      assert.equal(canRecordReceivablePayment(status), true);
    }

    for (const status of ['PAID', 'CANCELED'] as const) {
      assert.equal(canEditReceivable(status), false);
      assert.equal(canRecordReceivablePayment(status), false);
    }
  });

  it('distinguishes integral, deposit and outstanding balance labels', () => {
    assert.equal(getReceivableKindLabel('FULL'), 'Pagamento integral');
    assert.equal(getReceivableKindLabel('DOWN_PAYMENT'), 'Entrada');
    assert.equal(getReceivableKindLabel('REMAINING_BALANCE'), 'Saldo restante');
  });

  it('labels terminal and intermediate statuses and payment methods without conflating credit and debit', () => {
    assert.equal(getReceivableStatusLabel('OPEN'), 'Em aberto');
    assert.equal(getReceivableStatusLabel('PARTIALLY_PAID'), 'Parcialmente pago');
    assert.equal(getReceivableStatusLabel('PAID'), 'Pago');
    assert.equal(getReceivableStatusLabel('CANCELED'), 'Cancelado');
    assert.equal(getReceivablePaymentMethodLabel('PIX'), 'PIX');
    assert.equal(getReceivablePaymentMethodLabel('CREDIT_CARD'), 'Cartão de crédito');
    assert.equal(getReceivablePaymentMethodLabel('DEBIT_CARD'), 'Cartão de débito');
    assert.equal(getReceivablePaymentMethodLabel('BANK_TRANSFER'), 'Transferência bancária');
  });
});
