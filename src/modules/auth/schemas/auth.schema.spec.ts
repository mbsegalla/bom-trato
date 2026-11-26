import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { actionTokenSchema, sessionResponseSchema, emailSchema } from './auth.schema';

describe('auth API contracts', () => {
  it('requires URL-safe single-use token shape', () => {
    assert.equal(actionTokenSchema.safeParse('a'.repeat(43)).success, true);

    for (const token of ['a'.repeat(42), 'a'.repeat(44), '/' + 'a'.repeat(42)]) assert.equal(actionTokenSchema.safeParse(token).success, false);
  });

  it('requires bearer token, CSRF token and positive lifetime', () => {
    const data = {
      accessToken: 'access',
      csrfToken: 'csrf',
      tokenType: 'Bearer',
      expiresIn: 60
    };
    const envelope = (patch: object) => ({ statusCode: 200, success: true, data: { ...data, ...patch } });

    assert.deepEqual(sessionResponseSchema.parse(envelope({})), data);

    for (const patch of [
      { csrfToken: '' },
      { accessToken: '' },
      { tokenType: 'Basic' },
      { expiresIn: 0 }
    ]) assert.equal(sessionResponseSchema.safeParse(envelope(patch)).success, false);

    assert.equal(emailSchema.parse(' user@example.invalid '), 'user@example.invalid');
  });
});
