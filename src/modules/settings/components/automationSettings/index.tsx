'use client';

import { Bot, CalendarClock, CircleCheck, Clock3, FileClock, LoaderCircle, ReceiptText, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { listAutomationEvents } from '@/modules/settings/services/automation.service';
import { getBusinessProfile, updateBusinessProfile } from '@/modules/settings/services/business.service';
import type { AutomationEvent } from '@/modules/settings/types/automation.types';
import type { BusinessProfile } from '@/modules/settings/types/business.types';
import { formatRelativeDateTime } from '@/shared/formatters/date.formatter';

type AutomationSettingKey =
  | 'autoQuoteFollowUpEnabled'
  | 'autoWorkOrderReminderEnabled'
  | 'autoReviewRequestEnabled'
  | 'autoReceivableReminderEnabled';

const automations = [
  {
    key: 'autoQuoteFollowUpEnabled',
    title: 'Acompanhar orçamentos sem resposta',
    description:
      'Para novos links compartilhados, envia um lembrete por e-mail quando o cliente não responder em até 48 horas.',
    icon: FileClock,
  },
  {
    key: 'autoWorkOrderReminderEnabled',
    title: 'Lembrar clientes de serviços agendados',
    description: 'Envia um lembrete por e-mail quando o serviço estiver a até 24 horas do horário agendado.',
    icon: CalendarClock,
  },
  {
    key: 'autoReviewRequestEnabled',
    title: 'Solicitar avaliação após o serviço',
    description: 'Ao concluir uma ordem de serviço, envia automaticamente o pedido de avaliação quando houver e-mail.',
    icon: Star,
  },
  {
    key: 'autoReceivableReminderEnabled',
    title: 'Lembrar clientes de pagamentos',
    description: 'Envia lembrete antes do vencimento e uma cobrança amigável se o recebível continuar em atraso.',
    icon: ReceiptText,
  },
] satisfies Array<{
  key: AutomationSettingKey;
  title: string;
  description: string;
  icon: typeof Bot;
}>;

function getStatusLabel(status: AutomationEvent['status']): string {
  switch (status) {
    case 'PENDING':
      return 'Agendado';
    case 'PROCESSING':
      return 'Enviando';
    case 'ACCEPTED':
      return 'Enviado';
    case 'FAILED':
      return 'Falhou';
    case 'SKIPPED':
      return 'Cancelado';
  }
}

export function AutomationSettings() {
  const router = useRouter();
  const { activeOrganization } = useApp();

  const owner = activeOrganization.role === 'OWNER';

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([getBusinessProfile(activeOrganization.id), listAutomationEvents(activeOrganization.id)])
      .then(([businessProfile, automationEvents]) => {
        if (!active) {
          return;
        }

        setProfile(businessProfile);
        setEvents(automationEvents);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as automações.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeOrganization.id, router]);

  function toggle(key: AutomationSettingKey): void {
    if (!owner) {
      return;
    }

    setProfile((current) =>
      current === null
        ? null
        : {
            ...current,
            [key]: !current[key],
          },
    );
  }

  async function save(): Promise<void> {
    if (!profile || !owner || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateBusinessProfile(activeOrganization.id, {
        autoQuoteFollowUpEnabled: profile.autoQuoteFollowUpEnabled,
        autoWorkOrderReminderEnabled: profile.autoWorkOrderReminderEnabled,
        autoReviewRequestEnabled: profile.autoReviewRequestEnabled,
        autoReceivableReminderEnabled: profile.autoReceivableReminderEnabled,
      });

      setProfile(updated);
      toast.success('Automações atualizadas com sucesso.');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      const message = cause instanceof Error ? cause.message : 'Não foi possível salvar as automações.';

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error ?? 'Não foi possível carregar as automações.'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Bot aria-hidden="true" className="size-5" />
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold">Piloto Automático</h2>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Escolha quais acompanhamentos o Bom Trato pode fazer automaticamente por você.
            </p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-border">
          {automations.map((automation) => {
            const Icon = automation.icon;
            const enabled = profile[automation.key];

            return (
              <div key={automation.key} className="flex items-start justify-between gap-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                    <Icon aria-hidden="true" className="size-4" />
                  </div>

                  <div>
                    <p className="font-medium">{automation.title}</p>

                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {automation.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-label={automation.title}
                  aria-checked={enabled}
                  disabled={!owner}
                  onClick={() => toggle(automation.key)}
                  className={cn(
                    'relative mt-1 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    enabled ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform',
                      enabled ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {owner && (
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="min-h-11 cursor-pointer rounded-xl px-5"
            >
              {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              Salvar automações
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">Histórico das automações</h2>
        </div>

        {events.length === 0 ? (
          <div className="py-10 text-center">
            <CircleCheck aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />

            <p className="mt-3 text-sm text-muted-foreground">Nenhuma automação executada ainda.</p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-border">
            {events.map((event) => (
              <Link
                key={event.id}
                href={event.href}
                className="flex items-start gap-4 py-4 transition-colors hover:text-primary"
              >
                <div
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    event.status === 'ACCEPTED' && 'bg-success',
                    event.status === 'FAILED' && 'bg-destructive',
                    (event.status === 'PENDING' || event.status === 'PROCESSING') && 'bg-info',
                    event.status === 'SKIPPED' && 'bg-muted-foreground',
                  )}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{event.description}</p>

                    <span className="text-xs text-muted-foreground">{getStatusLabel(event.status)}</span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">{formatRelativeDateTime(event.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
