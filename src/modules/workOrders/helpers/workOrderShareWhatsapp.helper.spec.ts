import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { WorkOrder } from '../types/workOrder.types';
import { createWorkOrderShareWhatsAppMessage, createWorkOrderShareWhatsAppUrl } from './workOrderShareWhatsapp.helper';

const order = { customerName: 'Cliente Teste', title: 'Fixture service', status: 'SCHEDULED', scheduledStartAt: new Date(2026, 0, 15, 10), scheduledEndAt: new Date(2026, 0, 15, 12) } as WorkOrder;
describe('work order portal message', () => {
  it('includes schedule only when scheduled and preserves the private share URL', () => {
    const link = 'https://web.example.invalid/acompanhar#token=' + 'a'.repeat(64);
    const scheduled = createWorkOrderShareWhatsAppMessage(order, 'Fixture', link);
    assert.match(scheduled, /agendado/);
    assert.match(scheduled, /Data e horário/);
    assert.match(scheduled, /Término previsto/);
    assert.match(scheduled, /pessoas autorizadas/);
    assert.ok(scheduled.includes(link));
    const completed = createWorkOrderShareWhatsAppMessage({ ...order, status: 'COMPLETED' }, 'Fixture', link);
    assert.match(completed, /concluído/);
    assert.doesNotMatch(completed, /Data e horário/);
    const url = new URL(createWorkOrderShareWhatsAppUrl('34999991234', scheduled));
    assert.equal(url.pathname, '/5534999991234');
    assert.equal(url.searchParams.get('text'), scheduled);
  });
});
