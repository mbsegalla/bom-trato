import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface LogoutAllSessionsCardProps {
  disabled: boolean;
  onLogoutAll(): void;
}

export function LogoutAllSessionsCard({ disabled, onLogoutAll }: LogoutAllSessionsCardProps) {
  return (
    <section className="rounded-2xl border border-destructive/20 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <LogOut aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-semibold">Encerrar todas as sessões</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Desconecta sua conta de todos os dispositivos, inclusive deste.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="destructive"
        disabled={disabled}
        onClick={onLogoutAll}
        className="mt-6 cursor-pointer"
      >
        <LogOut aria-hidden="true" className="size-4" />
        Sair de todos os dispositivos
      </Button>
    </section>
  );
}
