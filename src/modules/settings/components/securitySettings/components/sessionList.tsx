import { ShieldCheck } from 'lucide-react';

import type { AuthSession } from '@/modules/auth/types/auth.types';

import { SessionRow } from './sessionRow';

interface SessionListProps {
  sessions: AuthSession[];
  disabled: boolean;
  onRevoke(session: AuthSession): void;
}

export function SessionList({ sessions, disabled, onRevoke }: SessionListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold">Sessões ativas</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Veja onde sua conta está conectada e encerre acessos que você não reconhece.
            </p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">Nenhuma sessão ativa foi encontrada.</div>
      ) : (
        <div className="divide-y divide-border">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} disabled={disabled} onRevoke={() => onRevoke(session)} />
          ))}
        </div>
      )}
    </section>
  );
}
