import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { z } from 'zod';
import { apiResponseSchema } from './apiResponse.schema';

describe('API response envelope', () => {
  const schema = apiResponseSchema(z.object({ id: z.string().min(1) }));

  it('unwraps only a valid success envelope', () => {
    assert.deepEqual(
      schema.parse({
        statusCode: 200,
        success: true,
        data: {
          id: 'item',
          privateToken: 'hidden'
        }
      }),
      { id: 'item' }
    );
  });

  it('rejects failed, malformed and missing data envelopes', () => {
    for (const value of [
      {
        statusCode: 200,
        success: false,
        data: { id: 'item' }
      },
      {
        statusCode: '200',
        success: true,
        data: { id: 'item' }
      },
      { statusCode: 200, success: true },
      {
        statusCode: 200,
        success: true,
        data: { id: '' }
      }
    ]) {
      assert.equal(schema.safeParse(value).success, false);
    }
  });
});
