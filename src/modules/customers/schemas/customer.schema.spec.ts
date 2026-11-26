import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { customerFormSchema } from './customer.schema';

const form = { name: ' Cliente ', email: '', phone: '+55 (34) 99999-1234', defaultServiceAddress: ' ', notes: ' note ' };
describe('customer form', () => {
  it('normalizes valid data and clears empty optional fields', () => {
    assert.deepEqual(customerFormSchema.parse(form), { name: 'Cliente', email: null, phone: '34999991234', defaultServiceAddress: null, notes: 'note' });
  });
  it('requires name and valid phone and validates optional email', () => {
    for (const patch of [{ name: 'A' }, { phone: '' }, { phone: '123' }, { email: 'bad' }]) assert.equal(customerFormSchema.safeParse({ ...form, ...patch }).success, false);
  });
});
