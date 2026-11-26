import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { notificationStreamTicketResponseSchema, inAppNotificationsResponseSchema } from './notification.schema';

describe('notification response contracts', () => {
  it('requires a URL-safe ephemeral stream ticket', () => {
    const data = { ticket: 'a'.repeat(43), expiresAt: '2026-01-01T00:00:00Z' };
    assert.equal(notificationStreamTicketResponseSchema.safeParse({ statusCode: 200, success: true, data }).success, true);
    assert.equal(notificationStreamTicketResponseSchema.safeParse({ statusCode: 200, success: true, data: { ...data, ticket: 'bad' } }).success, false);
  });
  it('rejects impossible unread counts', () => {
    assert.equal(inAppNotificationsResponseSchema.safeParse({ statusCode: 200, success: true, data: { items: [], unreadCount: -1 } }).success, false);
  });
});
