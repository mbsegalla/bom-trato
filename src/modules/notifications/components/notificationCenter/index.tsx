'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationStream } from '../../hooks/useNotificationStream';
import type { InAppNotification } from '../../types/notification.types';
import { NotificationPopover } from './components/notificationPopover';

export function NotificationCenter({ organizationId }: { organizationId: string }) {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const notifications = useNotifications(organizationId);

  useNotificationStream({
    organizationId,
    onNotification: notifications.refresh,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      const container = containerRef.current;

      if (!container || !(event.target instanceof Node)) {
        return;
      }

      if (!container.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleOpenNotification(notification: InAppNotification): Promise<void> {
    setOpen(false);

    await notifications.markRead(notification);

    router.push(notification.href);
  }

  return (
    <div ref={containerRef} className="relative">
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
          onRetry={() => void notifications.refresh()}
          onMarkAllRead={() => void notifications.markAllRead()}
          onOpenNotification={(notification) => void handleOpenNotification(notification)}
        />
      )}
    </div>
  );
}
