'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SessionError } from '@/modules/auth/services/session.service';

import {
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
} from '../services/notification.service';
import type { InAppNotification, InAppNotifications } from '../types/notification.types';

const fallbackRefreshMs = 5 * 60 * 1000;

export interface UseNotificationsResult {
  items: InAppNotification[] | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markingAll: boolean;
  refresh(): Promise<void>;
  markRead(notification: InAppNotification): Promise<void>;
  markAllRead(): Promise<void>;
}

export function useNotifications(organizationId: string): UseNotificationsResult {
  const router = useRouter();

  const mountedRef = useRef(false);

  const [snapshot, setSnapshot] = useState<InAppNotifications | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleError = useCallback(
    (cause: unknown, fallback: string): void => {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      if (!mountedRef.current) {
        return;
      }

      setError(cause instanceof Error ? cause.message : fallback);
    },
    [router],
  );

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const result = await listInAppNotifications(organizationId);

      if (!mountedRef.current) {
        return;
      }

      setSnapshot(result);
      setError(null);
    } catch (cause: unknown) {
      handleError(cause, 'Não foi possível carregar suas notificações.');
    }
  }, [handleError, organizationId]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refresh();
    }, 0);

    const interval = window.setInterval(() => {
      void refresh();
    }, fallbackRefreshMs);

    const handleFocus = (): void => {
      void refresh();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);

      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh]);

  const markRead = useCallback(
    async (notification: InAppNotification): Promise<void> => {
      if (notification.readAt !== null) {
        return;
      }

      const now = new Date();

      setSnapshot((current) => {
        if (current === null) {
          return current;
        }

        return {
          unreadCount: Math.max(0, current.unreadCount - 1),
          items: current.items.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  readAt: now,
                }
              : item,
          ),
        };
      });

      try {
        await markInAppNotificationRead(organizationId, notification.id);
      } catch (cause: unknown) {
        handleError(cause, 'Não foi possível atualizar a notificação.');

        if (!(cause instanceof SessionError) || cause.status !== 401) {
          void refresh();
        }
      }
    },
    [handleError, organizationId, refresh],
  );

  const markAllRead = useCallback(async (): Promise<void> => {
    if (markingAll || snapshot === null || snapshot.unreadCount === 0) {
      return;
    }

    setMarkingAll(true);
    setError(null);

    try {
      await markAllInAppNotificationsRead(organizationId);

      if (!mountedRef.current) {
        return;
      }

      const now = new Date();

      setSnapshot((current) => {
        if (current === null) {
          return current;
        }

        return {
          unreadCount: 0,
          items: current.items.map((notification) => ({
            ...notification,
            readAt: notification.readAt ?? now,
          })),
        };
      });
    } catch (cause: unknown) {
      handleError(cause, 'Não foi possível marcar as notificações como lidas.');
    } finally {
      if (mountedRef.current) {
        setMarkingAll(false);
      }
    }
  }, [handleError, markingAll, organizationId, snapshot]);

  return {
    items: snapshot?.items ?? null,
    unreadCount: snapshot?.unreadCount ?? 0,
    loading: snapshot === null && error === null,
    error,
    markingAll,
    refresh,
    markRead,
    markAllRead,
  };
}
