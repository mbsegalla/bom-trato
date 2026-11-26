import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { receivingSettingsFormSchema, receivingSettingsSchema } from './receivingSettings.schema';

describe('receiving settings', () => {
  it('requires recipient confirmation before enabling Pix', () => {
    const input = {
      pixEnabled: true,
      pixKeyType: 'EMAIL',
      pixKey: 'fixture@example.invalid',
      merchantName: 'Empresa',
      merchantCity: 'Uberlandia',
      confirmed: true,
      version: 0,
    };

    assert.equal(receivingSettingsFormSchema.safeParse(input).success, true);
    assert.equal(receivingSettingsFormSchema.safeParse({ ...input, confirmed: false }).success, false);
  });

  it('requires sensitive fields to be absent when disabled and encryption to configure', () => {
    const disabled = {
      pixEnabled: false,
      pixKeyType: null,
      pixKey: null,
      merchantName: null,
      merchantCity: null,
      version: 0,
      canConfigure: false,
      encryptionAvailable: false,
    };

    assert.equal(receivingSettingsSchema.safeParse(disabled).success, true);
    assert.equal(receivingSettingsSchema.safeParse({ ...disabled, pixKey: 'hidden' }).success, false);
    assert.equal(receivingSettingsSchema.safeParse({ ...disabled, canConfigure: true }).success, false);
  });
});
