import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getQuoteDownPaymentAmountInCents,
  getQuotePaymentConditionDescription,
  getQuotePaymentConditionLabel,
  getQuoteStatusLabel,
  isQuoteExpired,
} from '@/modules/quotes/constants/quote.constants';
import {
  canCancelWorkOrder,
  getWorkOrderStatusLabel,
  isWorkOrderPlanningEditable,
} from '@/modules/workOrders/constants/workOrder.constants';

describe('quote and work order status and payment presentation', () => {
  for (const [status, label] of [
    ['DRAFT', 'Rascunho'],
    ['SENT', 'Enviado'],
    ['APPROVED', 'Aprovado'],
    ['DECLINED', 'Recusado'],
    ['CANCELED', 'Cancelado'],
  ] as const) {
    it('labels quote status ' + status + ' without inventing an expiration', () => {
      assert.equal(getQuoteStatusLabel(status), label);
      assert.equal(isQuoteExpired(status, null), false);
      if (status !== 'SENT') assert.equal(getQuoteStatusLabel(status, new Date(0)), label);
    });
  }

  it('marks only a sent quote expired at the validity boundary', (t) => {
    const now = new Date('2030-01-01T00:00:00Z');
    t.mock.method(Date, 'now', () => now.getTime());
    assert.equal(getQuoteStatusLabel('SENT', now), 'Expirado');
    assert.equal(getQuoteStatusLabel('SENT', new Date(now.getTime() + 1)), 'Enviado');
    assert.equal(isQuoteExpired('SENT', new Date(now.getTime() - 1)), true);
    assert.equal(isQuoteExpired('APPROVED', now), false);
  });

  it('describes each payment condition and rounds the down payment to integer cents', () => {
    assert.equal(getQuotePaymentConditionLabel('AFTER_COMPLETION'), 'Após a conclusão');
    assert.match(getQuotePaymentConditionDescription('AFTER_COMPLETION'), /após a conclusão/);
    assert.equal(getQuotePaymentConditionLabel('UPFRONT'), 'Pagamento integral antecipado');
    assert.match(getQuotePaymentConditionDescription('UPFRONT'), /antecipadamente/);
    assert.equal(getQuotePaymentConditionLabel('DOWN_PAYMENT_AND_BALANCE'), 'Entrada + saldo');
    assert.match(getQuotePaymentConditionDescription('DOWN_PAYMENT_AND_BALANCE'), /Defina a porcentagem/);
    assert.match(getQuotePaymentConditionDescription('DOWN_PAYMENT_AND_BALANCE', null), /Defina a porcentagem/);
    assert.match(getQuotePaymentConditionDescription('DOWN_PAYMENT_AND_BALANCE', 33), /33%/);
    assert.equal(getQuoteDownPaymentAmountInCents(10001, 33), 3300);
    assert.equal(getQuoteDownPaymentAmountInCents(10001, null), 0);
  });

  for (const [status, label, editable, cancelable] of [
    ['OPEN', 'Aberta', true, true],
    ['SCHEDULED', 'Agendada', true, true],
    ['IN_PROGRESS', 'Em andamento', false, true],
    ['COMPLETED', 'Concluída', false, false],
    ['CANCELED', 'Cancelada', false, false],
  ] as const) {
    it('preserves work order presentation and action restrictions for ' + status, () => {
      assert.equal(getWorkOrderStatusLabel(status), label);
      assert.equal(isWorkOrderPlanningEditable(status), editable);
      assert.equal(canCancelWorkOrder(status), cancelable);
    });
  }
});
