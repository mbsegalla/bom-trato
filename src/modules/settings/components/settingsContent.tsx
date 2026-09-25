'use client';

import { Building2, CreditCard, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { BusinessSettings } from './businessSettings';
import { SecuritySettings } from './securitySettings';
import { SubscriptionSettings } from './subscriptionSettings';
import { TeamSettings } from './teamSettings';

export type SettingsTab = 'business' | 'team' | 'billing' | 'security';

interface SettingsContentProps {
  initialTab: SettingsTab;
}

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

        <p className="mt-2 text-muted-foreground">Gerencie seu negócio, equipe, assinatura e segurança.</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        <Button
          type="button"
          variant={tab === 'business' ? 'default' : 'ghost'}
          onClick={() => changeTab('business')}
          className="cursor-pointer rounded-lg"
        >
          <Building2 className="size-4" />
          Negócio
        </Button>

        <Button
          type="button"
          variant={tab === 'team' ? 'default' : 'ghost'}
          onClick={() => changeTab('team')}
          className="cursor-pointer rounded-lg"
        >
          <Users className="size-4" />
          Equipe
        </Button>

        <Button
          type="button"
          variant={tab === 'billing' ? 'default' : 'ghost'}
          onClick={() => changeTab('billing')}
          className="cursor-pointer rounded-lg"
        >
          <CreditCard className="size-4" />
          Assinatura
        </Button>

        <Button
          type="button"
          variant={tab === 'security' ? 'default' : 'ghost'}
          onClick={() => changeTab('security')}
          className="cursor-pointer rounded-lg"
        >
          <ShieldCheck className="size-4" />
          Segurança
        </Button>
      </div>

      <div className="mt-6">
        {tab === 'business' && <BusinessSettings />}
        {tab === 'team' && <TeamSettings />}
        {tab === 'billing' && <SubscriptionSettings />}
        {tab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
}
