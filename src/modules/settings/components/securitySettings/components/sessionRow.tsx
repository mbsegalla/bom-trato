import { Clock3, Monitor, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AuthSession } from '@/modules/auth/types/auth.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';
import { describeUserAgent } from '@/shared/formatters/userAgent.formatter';

interface SessionRowProps {
  session: AuthSession;
  disabled: boolean;
  onRevoke(): void;
}

export function SessionRow({ session, disabled, onRevoke }: SessionRowProps) {
  const device = describeUserAgent(session.userAgent);
  const DeviceIcon = device.mobile ? Smartphone : Monitor;

  return (
    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <DeviceIcon aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{device.label}</p>
            {session.current && (
              <span className="rounded-full bg-success-surface px-2.5 py-1 text-xs font-medium text-success">
                Este dispositivo
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
              Sessão iniciada em {formatDateTime(session.createdAt)}
            </p>
            <p>Última renovação em {formatDateTime(session.lastRefreshedAt)}</p>
            <p>Expira em {formatDateTime(session.absoluteExpiresAt)}</p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant={session.current ? 'outline' : 'destructive'}
        disabled={disabled}
        onClick={onRevoke}
        className="cursor-pointer self-start sm:self-auto"
      >
        {session.current ? 'Sair deste dispositivo' : 'Encerrar'}
      </Button>
    </div>
  );
}
