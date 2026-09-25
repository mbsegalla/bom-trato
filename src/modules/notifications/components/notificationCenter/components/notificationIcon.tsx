import {
  Bell,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileX2,
  UserRoundPlus,
} from 'lucide-react';

import type { InAppNotificationType } from '../../../types/notification.types';

export function NotificationIcon({ type }: { type: InAppNotificationType }) {
  switch (type) {
    case 'QUOTE_APPROVED':
      return <FileCheck2 aria-hidden="true" className="size-4" />;
    case 'QUOTE_DECLINED':
      return <FileX2 aria-hidden="true" className="size-4" />;
    case 'WORK_ORDER_ASSIGNED':
      return <ClipboardCheck aria-hidden="true" className="size-4" />;
    case 'WORK_ORDER_SCHEDULED':
    case 'WORK_ORDER_RESCHEDULED':
      return <CalendarClock aria-hidden="true" className="size-4" />;
    case 'ORGANIZATION_MEMBER_JOINED':
      return <UserRoundPlus aria-hidden="true" className="size-4" />;
    case 'PAYMENT_FAILED':
    case 'PAYMENT_ACTION_REQUIRED':
    case 'SUBSCRIPTION_CANCELED':
      return <CircleAlert aria-hidden="true" className="size-4" />;
    case 'PAYMENT_CONFIRMED':
      return <CreditCard aria-hidden="true" className="size-4" />;
    case 'SUBSCRIPTION_ACTIVATED':
    case 'PLAN_CHANGE_CONFIRMED':
      return <CircleCheck aria-hidden="true" className="size-4" />;
    default:
      return <Bell aria-hidden="true" className="size-4" />;
  }
}
