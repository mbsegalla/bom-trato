import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Customer } from '@/modules/customers/types/customer.types';
import type { Receivable } from '../types/receivable.types';
import { canPrepareReceivableCharge, createReceivableChargeMessage } from './receivableWhatsapp.helper';

const receivable = { customerId: 'customer', organizationId: 'org', title: 'Fixture service', kind: 'FULL', status: 'PARTIALLY_PAID', currency: 'brl', balanceInCents: 1001, dueAt: new Date(2026, 0, 15) } as Receivable;
const customer = { id: 'customer', organizationId: 'org', name: 'Cliente Nome', archivedAt: null, phone: '34999991234' } as Customer;
describe('receivable reminder safeguards', () => {
  it('prepares only the remaining balance and uses the correct customer phone', () => {
    const result = createReceivableChargeMessage(receivable, customer, 'Fixture');
    assert.match(result.message, /Olá, Cliente!/);
    assert.match(result.message, /10,01/);
    assert.match(result.message, /15\/01\/2026/);
    assert.equal(new URL(result.url).pathname, '/5534999991234');
    assert.equal(new URL(result.url).searchParams.get('text'), result.message);
  });
  it('refuses terminal receivables, unsafe amounts and other customer or tenant data', () => {
    for (const patch of [{ status: 'PAID' as const }, { status: 'CANCELED' as const }, { balanceInCents: 0 }, { balanceInCents: 1.5 }, { currency: 'usd' }, { dueAt: new Date(NaN) }]) {
      assert.equal(canPrepareReceivableCharge({ ...receivable, ...patch } as Receivable), false);
    }
    for (const patch of [{ id: 'other' }, { organizationId: 'other' }, { archivedAt: new Date() }, { phone: '123' }]) {
      assert.throws(() => createReceivableChargeMessage(receivable, { ...customer, ...patch }, 'Fixture'), /cadastro e o telefone/);
    }
  });
});
