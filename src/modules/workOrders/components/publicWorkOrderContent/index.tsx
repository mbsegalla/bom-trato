'use client';

import { Link2Off, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/brandLogo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { PublicWorkOrderError, resolvePublicWorkOrder } from '../../services/workOrderPortal.service';
import type { PublicWorkOrderAcceptanceReceipt } from '../../types/workOrderAcceptance.types';
import type { PublicWorkOrder } from '../../types/workOrderPortal.types';
import { PublicWorkOrderAcceptanceSection } from './components/publicWorkOrderAcceptance';
import { PublicWorkOrderChecklist } from './components/publicWorkOrderChecklist';
import { PublicWorkOrderOverview } from './components/publicWorkOrderOverview';
import { PublicWorkOrderPhotos } from './components/publicWorkOrderPhotos';
import { PublicWorkOrderPortfolioConsent } from './components/publicWorkOrderPortfolioConsent';
import { PublicWorkOrderSummary } from './components/publicWorkOrderSummary';
import { PublicWorkOrderTimeline } from './components/publicWorkOrderTimeline';
import { PublicWorkOrderWarranty } from './components/publicWorkOrderWarranty';

type PublicWorkOrderState =
  | {
      kind: 'loading';
    }
  | {
      kind: 'ready';
      portal: PublicWorkOrder;
      token: string;
    }
  | {
      kind: 'unavailable';
      message: string;
      retryable: boolean;
    };

const MAX_TIMEOUT_MS = 2_147_483_647;

export function PublicWorkOrderContent() {
  const [state, setState] = useState<PublicWorkOrderState>({
    kind: 'loading',
  });

  const expiresAt = state.kind === 'ready' ? state.portal.expiresAt.getTime() : null;
  const generatedAt = state.kind === 'ready' ? state.portal.generatedAt.getTime() : null;

  useEffect(() => {
    let active = true;

    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';

    void resolvePublicWorkOrder(token)
      .then((portal) => {
        if (!active) {
          return;
        }

        setState({
          kind: 'ready',
          portal,
          token,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setState({
          kind: 'unavailable',
          message:
            cause instanceof PublicWorkOrderError
              ? cause.message
              : 'Não foi possível carregar seu atendimento. Confira sua conexão e tente novamente.',
          retryable: cause instanceof PublicWorkOrderError ? cause.retryable : true,
        });
      });

    function handleHashChange(): void {
      window.location.reload();
    }

    function handlePageShow(event: PageTransitionEvent): void {
      if (event.persisted) {
        window.location.reload();
      }
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      active = false;

      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    if (expiresAt === null || generatedAt === null) {
      return;
    }

    const remaining = expiresAt - generatedAt;

    const timeout = window.setTimeout(
      () => {
        if (remaining > MAX_TIMEOUT_MS) {
          window.location.reload();

          return;
        }

        setState({
          kind: 'unavailable',
          message:
            'O prazo de validade deste link terminou. Solicite um novo compartilhamento ao profissional responsável.',
          retryable: false,
        });
      },
      Math.max(0, Math.min(remaining, MAX_TIMEOUT_MS)),
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [expiresAt, generatedAt]);

  function applyAcceptance(token: string, receipt: PublicWorkOrderAcceptanceReceipt): void {
    setState((current) =>
      current.kind === 'ready' && current.token === token && current.portal.acceptance !== null
        ? {
            ...current,
            portal: {
              ...current.portal,
              acceptance: { ...current.portal.acceptance, canAccept: false, snapshotHash: null, receipt },
            },
          }
        : current,
    );
  }

  if (state.kind === 'loading') {
    return <PublicWorkOrderSkeleton />;
  }

  if (state.kind === 'unavailable') {
    return <PublicWorkOrderUnavailable message={state.message} retryable={state.retryable} />;
  }

  const { portal, token } = state;

  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <PublicWorkOrderHeader />

        <div className="mt-7">
          <PublicWorkOrderOverview portal={portal} />
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <PublicWorkOrderTimeline timeline={portal.timeline} />

          <PublicWorkOrderSummary portal={portal} />
        </div>

        <PublicWorkOrderChecklist checklist={portal.checklist} />

        <PublicWorkOrderPhotos photos={portal.photos} token={token} />

        <PublicWorkOrderPortfolioConsent
          photos={portal.photos}
          token={token}
          completed={portal.workOrder.status === 'COMPLETED'}
        />

        <PublicWorkOrderWarranty portal={portal} token={token} />

        <PublicWorkOrderAcceptanceSection
          key={token}
          acceptance={portal.acceptance}
          status={portal.workOrder.status}
          token={token}
          onAccepted={(receipt) => applyAcceptance(token, receipt)}
        />

        <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Informações atualizadas em {formatDateTime(portal.generatedAt)}</p>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Os horários são exibidos de acordo com o fuso horário do seu dispositivo.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="min-h-11 cursor-pointer"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Atualizar atendimento
          </Button>
        </section>

        <footer className="mt-8 flex flex-col items-center gap-3 pb-4 text-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            Link privado válido até {formatDateTime(portal.expiresAt)}
          </div>

          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Este endereço permite acompanhar o atendimento e registrar o aceite da conclusão. Compartilhe-o somente com
            pessoas autorizadas.
          </p>

          <BrandLogo className="mt-3 w-28" />

          <p className="text-xs text-muted-foreground">Atendimento gerenciado com Bom Trato.</p>

          <p className="text-xs font-medium text-primary">Gestão que cuida de cada detalhe.</p>
        </footer>
      </div>
    </main>
  );
}

function PublicWorkOrderHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <BrandLogo priority className="w-32 sm:w-40" />

      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
        Acesso privado
      </div>
    </header>
  );
}

function PublicWorkOrderSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando atendimento"
      className="min-h-dvh bg-background px-4 py-6 sm:px-6 sm:py-10"
    >
      <span role="status" className="sr-only">
        Carregando informações do atendimento...
      </span>

      <div className="mx-auto max-w-6xl">
        <PublicWorkOrderHeader />

        <div aria-hidden="true" className="mt-7 space-y-4">
          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-2xl" />

              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-44 max-w-full" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>
            </div>

            <Skeleton className="mt-8 h-8 w-32 rounded-full" />
            <Skeleton className="mt-5 h-10 w-96 max-w-full" />
            <Skeleton className="mt-4 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-3/4 max-w-lg" />
            <Skeleton className="mt-8 h-6 w-56 max-w-full" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="size-11 rounded-xl" />
                <Skeleton className="mt-4 h-3 w-28" />
                <Skeleton className="mt-3 h-6 w-40 max-w-full" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="rounded-3xl border border-border bg-card p-6">
              <Skeleton className="h-6 w-48 max-w-full" />

              <div className="mt-8 space-y-7">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <Skeleton className="size-10 shrink-0 rounded-full" />

                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-40 max-w-full" />
                      <Skeleton className="h-3 w-28 max-w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-6 h-20 w-full rounded-xl" />
              <Skeleton className="mt-6 h-4 w-full" />
              <Skeleton className="mt-4 h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PublicWorkOrderUnavailable({ message, retryable }: { message: string; retryable: boolean }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10 text-foreground">
      <BrandLogo priority className="mb-10 w-40" />

      <section
        role="alert"
        className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-10"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Link2Off aria-hidden="true" className="size-8" />
        </div>

        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">Atendimento indisponível</h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{message}</p>

        {retryable && (
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 min-h-11 w-full cursor-pointer"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Tentar novamente
          </Button>
        )}

        <div className="mt-7 border-t border-border pt-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Por segurança, os links de acompanhamento possuem validade limitada e podem ser revogados pelo profissional.
          </p>
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-muted-foreground">Atendimento gerenciado pelo Bom Trato.</p>
    </main>
  );
}
