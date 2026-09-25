'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { SessionError } from '@/modules/auth/services/session.service';

import { createNotificationStreamTicket, notificationStreamUrl } from '../services/notification.service';

interface UseNotificationStreamParams {
  organizationId: string;
  onNotification(): void;
}

export function useNotificationStream({ organizationId, onNotification }: UseNotificationStreamParams): void {
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;

    function scheduleReconnect(): void {
      if (disposed || reconnectTimer !== null) {
        return;
      }

      const delay = Math.min(30_000, 1000 * 2 ** Math.min(reconnectAttempts, 5));

      reconnectAttempts += 1;

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;

        void connect();
      }, delay);
    }

    async function connect(): Promise<void> {
      try {
        const { ticket } = await createNotificationStreamTicket(organizationId);

        if (disposed) {
          return;
        }

        source = new EventSource(notificationStreamUrl(organizationId, ticket));

        source.onopen = () => {
          reconnectAttempts = 0;
        };

        source.addEventListener('notifications-changed', onNotification);

        source.onerror = () => {
          source?.close();
          source = null;

          scheduleReconnect();
        };
      } catch (cause: unknown) {
        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        scheduleReconnect();
      }
    }

    void connect();

    return () => {
      disposed = true;

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }

      source?.close();
    };
  }, [organizationId, onNotification, router]);
}
