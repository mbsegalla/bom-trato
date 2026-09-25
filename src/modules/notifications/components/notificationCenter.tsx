'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { useNotifications } from '../hooks/useNotifications';
import { useNotificationStream } from '../hooks/useNotificationStream';
import type { InAppNotification } from '../types/notification.types';
import { NotificationPopover } from './notificationPopover';

interface NotificationCenterProps {
  organizationId: string;
}

export function NotificationCenter({ organizationId }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const notifications = useNotifications(organizationId);

  useNotificationStream({
    organizationId,
    onNotification: notifications.refresh,
  });

  async function handleOpenNotification(notification: InAppNotification): Promise<void> {
    setOpen(false);

    await notifications.markRead(notification);

    router.push(notification.href);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          notifications.unreadCount > 0 ? `Notificações, ${notifications.unreadCount} não lidas` : 'Notificações'
        }
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative cursor-pointer"
      >
        <Bell aria-hidden="true" className="size-5" />

        {notifications.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-5 font-semibold text-white">
            {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <NotificationPopover
          items={notifications.items}
          unreadCount={notifications.unreadCount}
          loading={notifications.loading}
          error={notifications.error}
          markingAll={notifications.markingAll}
          onRetry={() => {
            void notifications.refresh();
          }}
          onMarkAllRead={() => {
            void notifications.markAllRead();
          }}
          onOpenNotification={(notification) => {
            void handleOpenNotification(notification);
          }}
        />
      )}
    </div>
  );
}
