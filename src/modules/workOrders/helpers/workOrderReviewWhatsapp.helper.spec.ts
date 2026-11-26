import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { WorkOrder } from '../types/workOrder.types';
import {
  createWorkOrderReviewUrl,
  createWorkOrderReviewWhatsAppMessage,
  createWorkOrderReviewWhatsAppUrl
} from './workOrderReviewWhatsapp.helper';

describe('review link privacy', () => {
  it('keeps the private review token in the fragment instead of the request query', (t) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(
      globalThis,
      'window',
      {
        configurable: true,
        value: { location: { origin: 'https://web.example.invalid' } }
      }
    );
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, 'window', previous);
      else Reflect.deleteProperty(globalThis, 'window');
    });
    const token = 'a'.repeat(64);
    const link = new URL(createWorkOrderReviewUrl(token));

    assert.equal(link.pathname, '/avaliar');
    assert.equal(link.search, '');
    assert.equal(new URLSearchParams(link.hash.slice(1)).get('token'), token);

    const order = { customerName: 'Cliente', title: 'Fixture service' } as WorkOrder;
    const message = createWorkOrderReviewWhatsAppMessage(order, 'Fixture', link.toString());

    assert.ok(message.includes(link.toString()));
    assert.equal(new URL(createWorkOrderReviewWhatsAppUrl('34999991234', message)).searchParams.get('text'), message);
    assert.throws(() => createWorkOrderReviewWhatsAppUrl('123', message), /inválido/);
  });
});
