'use client';

import { Building2, CreditCard, Palette, ShieldCheck, Store, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { AppearanceSettings } from './appearanceSettings';
import { BusinessSettings } from './businessSettings';
import { PublicProfileSettings } from './publicProfileSettings';
import { SecuritySettings } from './securitySettings';
import { SubscriptionSettings } from './subscriptionSettings';
import { TeamSettings } from './teamSettings';

export type SettingsTab = 'business' | 'showcase' | 'team' | 'billing' | 'appearance' | 'security';

interface SettingsContentProps {
  initialTab: SettingsTab;
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
    value: 'billing',
    label: 'Assinatura',
    icon: CreditCard,
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
          Gerencie seu negócio, vitrine, equipe, assinatura, aparência e segurança.
        </p>
      </div>

      <nav aria-label="Configurações" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-border">
        {tabs.map((item) => {
          const Icon = item.icon;

          return (
            <Button
              key={item.value}
              type="button"
              variant="ghost"
              aria-current={tab === item.value ? 'page' : undefined}
              onClick={() => changeTab(item.value)}
              className={cn(
                'cursor-pointer rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-1 pb-3 hover:bg-transparent',
                tab === item.value && 'border-primary text-primary',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="mt-8">
        {tab === 'business' && <BusinessSettings />}
        {tab === 'showcase' && <PublicProfileSettings />}
        {tab === 'team' && <TeamSettings />}
        {tab === 'billing' && <SubscriptionSettings />}
        {tab === 'appearance' && <AppearanceSettings />}
        {tab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
}
