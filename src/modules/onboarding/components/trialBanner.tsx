import { ArrowRight, CalendarDays, Gift } from 'lucide-react';
import Link from 'next/link';

import { formatDateTime } from '@/shared/formatters/date.formatter';

import { getTrialProgress, getTrialRemainingDaysLabel, getTrialSubscriptionHref } from '../helpers/trial.helper';
import type { OnboardingTrial } from '../types/onboarding.types';

interface TrialBannerProps {
  trial: OnboardingTrial;
  organizationId: string;
  owner: boolean;
}

export function TrialBanner({ trial, organizationId, owner }: TrialBannerProps) {
  if (!trial.active) {
    return null;
  }

  const urgent = trial.remainingDays <= 3;
  const progress = getTrialProgress(trial);

  const remainingDaysLabel = getTrialRemainingDaysLabel(trial.remainingDays);

  return (
    <section
      aria-label="Avaliação gratuita"
      className={
        urgent
          ? 'rounded-2xl border border-warning/20 bg-warning-surface p-5'
          : 'rounded-2xl border border-primary/20 bg-primary/5 p-5'
      }
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={
              urgent
                ? 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-warning'
                : 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'
            }
          >
            <Gift aria-hidden="true" className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold">Sua avaliação gratuita está ativa</p>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Conheça o Bom Trato e escolha seu plano quando estiver pronto.
            </p>

            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              Disponível até {formatDateTime(trial.expiresAt)}
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-48">
          <p className={urgent ? 'text-sm font-semibold text-warning' : 'text-sm font-semibold text-primary'}>
            {remainingDaysLabel}
          </p>

          <div
            role="progressbar"
            aria-label="Período restante da avaliação"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={remainingDaysLabel}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
          >
            <div
              className={urgent ? 'h-full rounded-full bg-warning' : 'h-full rounded-full bg-primary'}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {owner && (
          <Link
            href={getTrialSubscriptionHref(organizationId)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Conhecer os planos
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
