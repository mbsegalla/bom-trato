import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { receivablePixChargeSchema } from './receivablePixCharge.schema';
const data = { organizationId: '11111111-1111-4111-8111-111111111111', receivableId: '22222222-2222-4222-8222-222222222222', receivableVersion: 1, receivingSettingsVersion: 2, amountInCents: 100, currency: 'brl', merchantName: 'TEST', txid: 'A'.repeat(25), copyAndPaste: '000201FIXTURE6304ABCD' };
describe('static Pix charge contract', () => {
  it('requires the exact versions, positive integer BRL amount, txid and printable payload', () => {
    assert.deepEqual(receivablePixChargeSchema.parse(data), data);
    for (const patch of [{ amountInCents: 0 }, { amountInCents: 1.5 }, { currency: 'usd' }, { receivableVersion: 0 }, { receivingSettingsVersion: 0 }, { txid: 'a'.repeat(25) }, { copyAndPaste: 'invalid' }, { copyAndPaste: '000201\n6304ABCD' }]) {
      assert.equal(receivablePixChargeSchema.safeParse({ ...data, ...patch }).success, false);
    }
  });
});
