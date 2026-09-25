import { cn } from '@/lib/utils';
import { formatRelativeDateTime } from '@/shared/formatters/date.formatter';

import type { InAppNotification } from '../types/notification.types';
import { NotificationIcon } from './notificationIcon';

interface NotificationItemProps {
  notification: InAppNotification;
  onOpen(): void;
}

export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const unread = notification.readAt === null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full cursor-pointer gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/60',
        unread && 'bg-brand-muted/40',
      )}
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        <NotificationIcon type={notification.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={cn('flex-1 text-sm', unread ? 'font-semibold' : 'font-medium')}>{notification.title}</p>

          {unread && <span aria-label="Não lida" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
        </div>

        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{notification.message}</p>

        <p className="mt-2 text-xs text-muted-foreground">{formatRelativeDateTime(notification.createdAt)}</p>
      </div>
    </button>
  );
}
