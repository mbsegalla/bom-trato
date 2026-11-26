import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createReceivablePixQrCode } from './receivablePixQrCode.helper';

describe('Pix QR geometry', () => {
  it('generates deterministic modules inside a four-module quiet zone', () => {
    const fixture = 'synthetic-pix-qr-payload';
    const result = createReceivablePixQrCode(fixture);

    assert.deepEqual(result, createReceivablePixQrCode(fixture));

    const points = [...result.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)];

    assert.ok(points.length > 0);
    for (const [, x, y] of points) {
      assert.ok(Number(x) >= 4 && Number(x) < result.size - 4);
      assert.ok(Number(y) >= 4 && Number(y) < result.size - 4);
    }
  });
});
