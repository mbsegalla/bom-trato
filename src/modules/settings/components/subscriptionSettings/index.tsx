'use client';

import { CircleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';

import {
  cancelBillingSubscription,
  createBillingPortal,
  getBillingEntitlements,
  getBillingPaymentMethod,
  getBillingSubscription,
  getRememberedPlanChange,
  listBillingInvoices,
  listBillingPlans,
  resumeBillingSubscription,
} from '../../services/billing.service';
import type { BillingData } from '../../types/billing.types';
import { BillingSettingsSkeleton } from '../billingSettingsSkeleton';
import { InvoiceList } from '../invoiceList';
import { PaymentMethodCard } from '../paymentMethodCard';
import { PaymentMethodPanel } from '../paymentMethodPanel';
import { PlanChangePanel } from '../planChangePanel';
import { SubscriptionOverview } from '../subscriptionOverview';
import { ActivePlanChangeNotice } from './components/activePlanChangeNotice';
import { BillingPortalCard } from './components/billingPortalCard';
import { MemberBillingNotice } from './components/memberBillingNotice';
import { MissingSubscriptionNotice } from './components/missingSubscriptionNotice';
import { findCurrentPlan } from './helpers/subscriptionSettings.helper';

interface BillingState {
  requestKey: string;
  data: BillingData;
}

interface BillingErrorState {
  requestKey: string;
  message: string;
}

type SubscriptionAction = 'CANCEL' | 'RESUME' | null;

export function SubscriptionSettings() {
  const { activeOrganization } = useApp();

  return (
    <OrganizationSubscriptionSettings
      key={activeOrganization.id}
      organizationId={activeOrganization.id}
      owner={activeOrganization.role === 'OWNER'}
    />
  );
}

function OrganizationSubscriptionSettings({ organizationId, owner }: { organizationId: string; owner: boolean }) {
  const router = useRouter();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<BillingState | null>(null);
  const [errorState, setErrorState] = useState<BillingErrorState | null>(null);
  const [planPanelOpen, setPlanPanelOpen] = useState(false);
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);
  const [subscriptionAction, setSubscriptionAction] = useState<SubscriptionAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const requestKey = `${organizationId}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    const cardRequest = owner ? getBillingPaymentMethod(organizationId) : Promise.resolve(null);

    const invoicesRequest = owner
      ? listBillingInvoices(organizationId)
      : Promise.resolve({ items: [], nextCursor: null });
    const planChangeRequest = owner ? getRememberedPlanChange(organizationId) : Promise.resolve(null);

    void Promise.all([
      getBillingSubscription(organizationId),
      getBillingEntitlements(organizationId),
      listBillingPlans(),
      cardRequest,
      invoicesRequest,
      planChangeRequest,
    ])
      .then(([subscription, entitlements, plans, card, invoices, activePlanChange]) => {
        if (!active) return;

        setErrorState(null);
        setState({ requestKey, data: { subscription, entitlements, plans, card, invoices, activePlanChange } });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar a assinatura.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, owner, refreshVersion, requestKey, router]);

  const data = state?.data ?? null;
  const error = errorState?.requestKey === requestKey ? errorState.message : null;
  const refreshing = state !== null && state.requestKey !== requestKey;

  function refresh(): void {
    setPlanPanelOpen(false);
    setPaymentPanelOpen(false);
    setActionError(null);
    setRefreshVersion((value) => value + 1);
  }

  async function executeSubscriptionAction(): Promise<void> {
    if (!subscriptionAction || actionLoading) return;

    setActionLoading(true);
    setActionError(null);
    try {
      if (subscriptionAction === 'CANCEL') {
        await cancelBillingSubscription(organizationId);
      } else {
        await resumeBillingSubscription(organizationId);
      }

      setSubscriptionAction(null);
      refresh();
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível alterar a assinatura.');
    } finally {
      setActionLoading(false);
    }
  }

  async function openPortal(): Promise<void> {
    if (portalLoading) return;

    setPortalLoading(true);
    setActionError(null);
    try {
      window.location.assign(await createBillingPortal(organizationId));
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível abrir o portal de faturamento.');
      setPortalLoading(false);
    }
  }

  if (!data && !error) {
    <BillingSettingsSkeleton />;
  }

  if (!data && error) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <CircleAlert className="mx-auto size-7 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" onClick={refresh} className="mt-5 cursor-pointer">
          Tentar novamente
        </Button>
      </section>
    );
  }

  if (!data) return null;

  const current = data.subscription ? findCurrentPlan(data.plans, data.subscription.planPriceId) : null;

  return (
    <div
      aria-busy={refreshing}
      className={refreshing ? 'space-y-5 opacity-70 transition-opacity' : 'space-y-5 transition-opacity'}
    >
      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
      )}
      {actionError && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {!data.subscription ? (
        <MissingSubscriptionNotice />
      ) : (
        <>
          <SubscriptionOverview
            subscription={data.subscription}
            plan={current?.plan ?? null}
            price={current?.price ?? null}
            entitlements={data.entitlements}
            owner={owner}
            activePlanChange={data.activePlanChange}
            onChangePlan={() => setPlanPanelOpen(true)}
            onCancel={() => setSubscriptionAction('CANCEL')}
            onResume={() => setSubscriptionAction('RESUME')}
          />

          {data.activePlanChange && owner && <ActivePlanChangeNotice onContinue={() => setPlanPanelOpen(true)} />}

          {owner ? (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                <PaymentMethodCard card={data.card} onChange={() => setPaymentPanelOpen(true)} />
                <BillingPortalCard loading={portalLoading} onOpen={() => void openPortal()} />
              </div>
              <InvoiceList key={state?.requestKey} organizationId={organizationId} initialPage={data.invoices} />
            </>
          ) : (
            <MemberBillingNotice />
          )}
        </>
      )}

      {planPanelOpen && data.subscription && (
        <PlanChangePanel
          organizationId={organizationId}
          subscription={data.subscription}
          plans={data.plans}
          memberCount={data.entitlements.memberCount}
          initialChange={data.activePlanChange}
          onClose={() => setPlanPanelOpen(false)}
          onChanged={refresh}
        />
      )}

      {paymentPanelOpen && (
        <PaymentMethodPanel
          organizationId={organizationId}
          onClose={() => setPaymentPanelOpen(false)}
          onSaved={refresh}
        />
      )}

      {subscriptionAction && (
        <ConfirmationDialog
          title={subscriptionAction === 'CANCEL' ? 'Cancelar renovação?' : 'Retomar assinatura?'}
          description={
            subscriptionAction === 'CANCEL'
              ? `Sua assinatura continuará funcionando até ${data.subscription ? new Intl.DateTimeFormat('pt-BR').format(data.subscription.currentPeriodEnd) : 'o fim do período atual'}.`
              : 'A renovação automática da assinatura será reativada.'
          }
          confirmLabel={subscriptionAction === 'CANCEL' ? 'Cancelar renovação' : 'Retomar assinatura'}
          destructive={subscriptionAction === 'CANCEL'}
          loading={actionLoading}
          onCancel={() => setSubscriptionAction(null)}
          onConfirm={() => void executeSubscriptionAction()}
        />
      )}
    </div>
  );
}
