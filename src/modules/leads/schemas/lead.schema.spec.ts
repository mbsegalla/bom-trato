import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { publicLeadFormSchema } from './lead.schema';

const input = {
  name: ' Cliente ',
  email: '',
  phone: '(34) 99999-1234',
  catalogServiceId: null,
  message: ' Preciso de uma revisao '
};

describe('public lead form', () => {
  it('allows a valid phone without optional email', () => {
    assert.equal(publicLeadFormSchema.parse(input).message, 'Preciso de uma revisao');
  });

  it('rejects missing contact, invalid optional email and short request', () => {
    for (const patch of [
      { phone: '' },
      { phone: '123' },
      { email: 'bad' },
      { message: 'oi' }
    ]) assert.equal(publicLeadFormSchema.safeParse({ ...input, ...patch }).success, false);
  });
});
