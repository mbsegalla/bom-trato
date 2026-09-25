import { Bell, CheckCheck, CircleAlert, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { InAppNotification } from '../../../types/notification.types';
import { NotificationItem } from './notificationItem';
import { NotificationListSkeleton } from './notificationListSkeleton';

interface NotificationPopoverProps {
  items: InAppNotification[] | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markingAll: boolean;
  onRetry(): void;
  onMarkAllRead(): void;
  onOpenNotification(notification: InAppNotification): void;
}

export function NotificationPopover({
  items,
  unreadCount,
  loading,
  error,
  markingAll,
  onRetry,
  onMarkAllRead,
  onOpenNotification,
}: NotificationPopoverProps) {
  const hasItems = items !== null && items.length > 0;
  const empty = items !== null && items.length === 0 && !error;

  return (
    <section
      aria-label="Notificações"
      className="absolute top-12 right-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
    >
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-heading font-semibold">Notificações</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {unreadCount === 0
              ? 'Nenhuma notificação não lida'
              : `${unreadCount.toLocaleString('pt-BR')} ${unreadCount === 1 ? 'não lida' : 'não lidas'}`}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={markingAll}
            onClick={onMarkAllRead}
            className="cursor-pointer"
          >
            <CheckCheck aria-hidden="true" className="size-4" />
            {markingAll ? 'Marcando...' : 'Marcar lidas'}
          </Button>
        )}
      </header>

      <div className="max-h-[min(32rem,70vh)] overflow-y-auto">
        {loading && <NotificationListSkeleton />}

        {error && !hasItems && <NotificationError message={error} onRetry={onRetry} />}

        {error && hasItems && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-border bg-destructive/5 px-5 py-3 text-xs text-destructive"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={onRetry} className="cursor-pointer font-medium underline underline-offset-2">
              Tentar novamente
            </button>
          </div>
        )}

        {empty && <NotificationEmptyState />}

        {hasItems && (
          <div className="divide-y divide-border">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={() => onOpenNotification(notification)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NotificationError({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <div className="p-6 text-center">
      <CircleAlert aria-hidden="true" className="mx-auto size-6 text-destructive" />
      <p role="alert" className="mt-3 text-sm text-destructive">
        {message}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4 cursor-pointer">
        <RefreshCw aria-hidden="true" className="size-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

function NotificationEmptyState() {
  return (
    <div className="px-6 py-10 text-center">
      <Bell aria-hidden="true" className="mx-auto size-7 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">Tudo tranquilo por aqui</p>
      <p className="mt-1 text-sm text-muted-foreground">Novidades importantes do seu negócio aparecerão aqui.</p>
    </div>
  );
}
