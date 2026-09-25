import type { z } from 'zod';

import type {
  inAppNotificationSchema,
  inAppNotificationsResponseSchema,
  inAppNotificationTypeSchema,
  notificationStreamTicketResponseSchema,
} from '../schemas/notification.schema';

export type InAppNotificationType = z.infer<typeof inAppNotificationTypeSchema>;

export type InAppNotification = z.infer<typeof inAppNotificationSchema>;

export type InAppNotifications = z.infer<typeof inAppNotificationsResponseSchema>;

export type NotificationStreamTicket = z.infer<typeof notificationStreamTicketResponseSchema>;
