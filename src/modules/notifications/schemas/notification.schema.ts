import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const inAppNotificationTypeSchema = z.enum([
  'LEAD_RECEIVED',
  'QUOTE_APPROVED',
  'QUOTE_DECLINED',
  'QUOTE_FOLLOW_UP',
  'WORK_ORDER_ASSIGNED',
  'WORK_ORDER_SCHEDULED',
  'WORK_ORDER_RESCHEDULED',
  'WORK_ORDER_REMINDER',
  'RECEIVABLE_DUE_SOON',
  'RECEIVABLE_OVERDUE',
  'ORGANIZATION_MEMBER_JOINED',
  'PAYMENT_FAILED',
  'PAYMENT_ACTION_REQUIRED',
  'PAYMENT_CONFIRMED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_CANCELED',
  'PLAN_CHANGE_CONFIRMED',
]);

export const inAppNotificationSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  type: inAppNotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  href: z.string(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const inAppNotificationsResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(inAppNotificationSchema),
    unreadCount: z.number().int().nonnegative(),
  }),
);

export const notificationStreamTicketResponseSchema = apiResponseSchema(
  z.object({
    ticket: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    expiresAt: z.coerce.date(),
  }),
);
