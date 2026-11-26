'use client';

import {
  ArrowRight,
  Bot,
  Building2,
  CreditCard,
  Gift,
  Palette,
  ReceiptText,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { TabButton } from '@/components/ui/tabButton';
import { useApp } from '@/modules/app/components/appProvider';
import {
  getTrialRemainingDaysLabel,
  getTrialSubscriptionHref,
  hasActiveTrial,
} from '@/modules/onboarding/helpers/trial.helper';
import type { OnboardingTrial } from '@/modules/onboarding/types/onboarding.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { AppearanceSettings } from './appearanceSettings';
import { AutomationSettings } from './automationSettings';
import { BusinessSettings } from './businessSettings';
import { PublicProfileSettings } from './publicProfileSettings';
import { ReceivingSettings } from './receivingSettings';
import { SecuritySettings } from './securitySettings';
import { SubscriptionSettings } from './subscriptionSettings';
import { TeamSettings } from './teamSettings';

export type SettingsTab =
  'business' | 'showcase' | 'team' | 'receiving' | 'billing' | 'automations' | 'appearance' | 'security';

interface SettingsContentProps {
  initialTab: SettingsTab;
}

interface TrialSubscriptionSettingsProps {
  trial: OnboardingTrial;
  organizationId: string;
  owner: boolean;
}

interface TrialInformationProps {
  label: string;
  value: string;
}

const tabs = [
  {
    value: 'business',
    label: 'Negócio',
    icon: Building2,
  },
  {
    value: 'showcase',
    label: 'Vitrine',
    icon: Store,
  },
  {
    value: 'team',
    label: 'Equipe',
    icon: Users,
  },
  {
    value: 'receiving',
    label: 'Recebimentos',
    icon: ReceiptText,
  },
  {
    value: 'billing',
    label: 'Assinatura',
    icon: CreditCard,
  },
  {
    value: 'automations',
    label: 'Automações',
    icon: Bot,
  },
  {
    value: 'appearance',
    label: 'Aparência',
    icon: Palette,
  },
  {
    value: 'security',
    label: 'Segurança',
    icon: ShieldCheck,
  },
] satisfies Array<{
  value: SettingsTab;
  label: string;
  icon: typeof Building2;
}>;

export function SettingsContent({ initialTab }: SettingsContentProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  function changeTab(nextTab: SettingsTab): void {
    setTab(nextTab);

    const url = new URL(window.location.href);

    url.searchParams.set('tab', nextTab);

    window.history.replaceState(window.history.state, '', url);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Configurações</h1>

        <p className="mt-2 text-muted-foreground">
          Gerencie seu negócio, vitrine, equipe, recebimentos, assinatura, automações, aparência e segurança.
        </p>
      </div>

      <nav aria-label="Configurações" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-border">
        {tabs.map((item) => {
          const Icon = item.icon;

          return (
            <TabButton
              key={item.value}
              type="button"
              active={tab === item.value}
              aria-current={tab === item.value ? 'page' : undefined}
              onClick={() => changeTab(item.value)}
              className="pb-3"
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </TabButton>
          );
        })}
      </nav>

      <div className="mt-8">
        {tab === 'business' && <BusinessSettings />}
        {tab === 'showcase' && <PublicProfileSettings />}
        {tab === 'team' && <TeamSettings />}
        {tab === 'receiving' && <ReceivingSettings />}
        {tab === 'billing' && <BillingSettings />}
        {tab === 'automations' && <AutomationSettings />}
        {tab === 'appearance' && <AppearanceSettings />}
        {tab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
}

function BillingSettings() {
  const { activeOrganization, onboarding } = useApp();

  if (!hasActiveTrial(onboarding) || onboarding.trial === null) {
    return <SubscriptionSettings />;
  }

  return (
    <TrialSubscriptionSettings
      trial={onboarding.trial}
      organizationId={activeOrganization.id}
      owner={activeOrganization.role === 'OWNER'}
    />
  );
}

function TrialSubscriptionSettings({ trial, organizationId, owner }: TrialSubscriptionSettingsProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-success-surface text-success">
            <Gift aria-hidden="true" className="size-6" />
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Avaliação gratuita</h2>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Você está experimentando o Bom Trato. Escolha uma assinatura para continuar utilizando a plataforma após o
              período gratuito.
            </p>
          </div>
        </div>

        {owner && (
          <Link
            href={getTrialSubscriptionHref(organizationId)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Escolher meu plano
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TrialInformation label="Valor da avaliação" value="R$ 0,00" />
        <TrialInformation label="Período restante" value={getTrialRemainingDaysLabel(trial.remainingDays)} />
        <TrialInformation label="Início da avaliação" value={formatDateTime(trial.startsAt)} />
        <TrialInformation label="Fim da avaliação" value={formatDateTime(trial.expiresAt)} />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />

        <div>
          <p className="text-sm font-medium">Sem compromisso financeiro</p>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            O encerramento da avaliação não gera cobrança automática. Você decide quando contratar uma assinatura.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrialInformation({ label, value }: TrialInformationProps) {
  return (
    <div className="rounded-xl bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>

      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
