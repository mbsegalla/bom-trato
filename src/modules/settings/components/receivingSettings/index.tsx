'use client';

import { LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';

import { getReceivingSettings } from '../../services/receivingSettings.service';
import type { ReceivingSettingsView } from '../../types/receivingSettings.types';
import { ReceivingSettingsForm } from './components/receivingSettingsForm';

type SettingsState =
  | { requestKey: number; kind: 'ready'; data: ReceivingSettingsView }
  | { requestKey: number; kind: 'error'; message: string };

export function ReceivingSettings() {
  const { activeOrganization, switchingOrganization } = useApp();

  if (activeOrganization.role !== 'OWNER') {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="font-heading text-xl font-semibold">Recebimentos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Somente o proprietário do negócio pode consultar ou alterar a conta recebedora.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <OrganizationReceivingSettings
      key={activeOrganization.id}
      organizationId={activeOrganization.id}
      switchingOrganization={switchingOrganization}
    />
  );
}

function OrganizationReceivingSettings({
  organizationId,
  switchingOrganization,
}: {
  organizationId: string;
  switchingOrganization: boolean;
}) {
  const router = useRouter();
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<SettingsState | null>(null);

  useEffect(() => {
    let active = true;

    void getReceivingSettings(organizationId)
      .then((data) => {
        if (active) {
          setState({ requestKey, kind: 'ready', data });
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setState({
          requestKey,
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar os dados de recebimento.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, requestKey, router]);

  function reload(): void {
    setRequestKey((value) => value + 1);
  }

  const current = state?.requestKey === requestKey ? state : null;

  if (current === null) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground"
      >
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Carregando dados de recebimento...
      </p>
    );
  }

  if (current.kind === 'error') {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p role="alert" className="text-sm text-destructive">
          {current.message}
        </p>
        <Button type="button" variant="outline" onClick={reload} className="mt-4 cursor-pointer">
          <RefreshCw aria-hidden="true" className="size-4" />
          Tentar novamente
        </Button>
      </section>
    );
  }

  return (
    <ReceivingSettingsForm
      key={`${requestKey}:${current.data.version}`}
      organizationId={organizationId}
      settings={current.data}
      switchingOrganization={switchingOrganization}
      onReload={reload}
      onSaved={(data) => setState({ requestKey, kind: 'ready', data })}
    />
  );
}
