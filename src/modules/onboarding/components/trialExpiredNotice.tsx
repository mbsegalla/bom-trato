import { Clock3, ShieldCheck } from 'lucide-react';

import { formatDate } from '@/shared/formatters/date.formatter';

import type { OnboardingTrial } from '../types/onboarding.types';

interface TrialExpiredNoticeProps {
  trial: OnboardingTrial;
}

export function TrialExpiredNotice({ trial }: TrialExpiredNoticeProps) {
  return (
    <section className="mb-8 rounded-2xl border border-warning/20 bg-warning-surface p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-warning">
          <Clock3 aria-hidden="true" className="size-5" />
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">Sua avaliação gratuita terminou</h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seu período de avaliação estava disponível até {formatDate(trial.expiresAt)}. Escolha um plano para
            continuar utilizando o Bom Trato.
          </p>

          <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            Seus clientes, orçamentos e serviços continuam salvos. Nenhuma cobrança automática foi realizada pelo
            encerramento da avaliação.
          </p>
        </div>
      </div>
    </section>
  );
}
