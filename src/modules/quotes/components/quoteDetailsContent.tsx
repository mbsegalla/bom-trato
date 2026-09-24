'use client';

import {
  ArrowLeft,
  Check,
  Clipboard,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { Input } from '@/components/ui/input';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { QuoteWorkOrderAction } from '@/modules/workOrders/components/quoteWorkOrderAction';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate, formatDateTime } from '@/shared/formatters/date.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

import { isQuoteExpired } from '../constants/quote.constants';
import type { QuoteConfirmation } from '../helpers/quoteConfirmation.helper';
import { getQuoteConfirmationContent } from '../helpers/quoteConfirmation.helper';
import {
  approveQuote,
  cancelQuote,
  createQuoteShare,
  declineQuote,
  downloadQuotePdf,
  getQuote,
  removeQuoteItem,
  revokeQuoteShare,
  sendQuote,
} from '../services/quote.service';
import type { Quote, QuoteItem } from '../types/quote.types';
import { QuoteDetailsFormPanel } from './quoteDetailsFormPanel';
import { QuoteItemFormPanel } from './quoteItemFormPanel';
import { QuoteStatusBadge } from './quoteStatusBadge';
import { QuoteStatusHistory } from './quoteStatusHistory';

interface QuoteDetailsContentProps {
  quoteId: string;
}

export function QuoteDetailsContent({ quoteId }: QuoteDetailsContentProps) {
  const { activeOrganization } = useApp();

  return (
    <OrganizationQuoteDetails
      key={`${activeOrganization.id}:${quoteId}`}
      organizationId={activeOrganization.id}
      quoteId={quoteId}
    />
  );
}

function OrganizationQuoteDetails({ organizationId, quoteId }: { organizationId: string; quoteId: string }) {
  const router = useRouter();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | undefined>();
  const [itemPanelOpen, setItemPanelOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<QuoteConfirmation | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let active = true;

    void getQuote(organizationId, quoteId)
      .then((result) => {
        if (!active) {
          return;
        }

        setLoadError(null);
        setQuote(result);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setLoadError(cause instanceof Error ? cause.message : 'Não foi possível carregar o orçamento.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, quoteId, refreshVersion, router]);

  function applyQuote(updated: Quote): void {
    setQuote(updated);
    setActionError(null);
  }

  async function executeConfirmation(): Promise<void> {
    if (!quote || !confirmation || operationLoading) {
      return;
    }

    setOperationLoading(true);
    setActionError(null);

    try {
      let updated: Quote;

      switch (confirmation.kind) {
        case 'SEND':
          updated = await sendQuote(organizationId, quote.id, quote.version);
          break;

        case 'APPROVE':
          updated = await approveQuote(organizationId, quote.id, quote.version);
          break;

        case 'DECLINE':
          updated = await declineQuote(organizationId, quote.id, quote.version);
          break;

        case 'CANCEL':
          updated = await cancelQuote(organizationId, quote.id, quote.version);
          break;

        case 'REMOVE_ITEM':
          updated = await removeQuoteItem(organizationId, quote.id, confirmation.item.id, quote.version);
          break;
      }

      applyQuote(updated);
      setConfirmation(null);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.');
    } finally {
      setOperationLoading(false);
    }
  }

  async function handlePdf(): Promise<void> {
    if (!quote || downloadingPdf) {
      return;
    }

    setDownloadingPdf(true);
    setActionError(null);

    try {
      const file = await downloadQuotePdf(organizationId, quote.id);

      const url = URL.createObjectURL(file.blob);

      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível baixar o PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function copyShareUrl(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);

      setShareMessage('Link copiado.');
    } catch {
      setShareMessage('Link criado. Copie manualmente abaixo.');
    }
  }

  async function handleCreateShare(): Promise<void> {
    if (!quote || sharing) {
      return;
    }

    setSharing(true);
    setActionError(null);
    setShareMessage(null);

    try {
      const maxExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000 - 60_000;

      const expiresAt =
        quote.validUntil === null
          ? new Date(maxExpiration)
          : new Date(Math.min(maxExpiration, quote.validUntil.getTime()));

      const share = await createQuoteShare(organizationId, quote.id, quote.version, expiresAt.toISOString());

      setShareUrl(share.url);

      await copyShareUrl(share.url);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível gerar o link.');
    } finally {
      setSharing(false);
    }
  }

  async function handleRevokeShare(): Promise<void> {
    if (!quote || sharing) {
      return;
    }

    setSharing(true);
    setActionError(null);

    try {
      await revokeQuoteShare(organizationId, quote.id);

      setShareUrl(null);
      setShareMessage('Links de compartilhamento revogados.');
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível revogar o link.');
    } finally {
      setSharing(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl">
        <Link href="/quotes" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para orçamentos
        </Link>

        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-destructive">{loadError}</p>

          <Button
            variant="outline"
            onClick={() => setRefreshVersion((value) => value + 1)}
            className="mt-5 cursor-pointer"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!quote) {
    return <DetailContentSkeleton label="Carregando orçamento" />;
  }

  const approved = quote.status === 'APPROVED';
  const draft = quote.status === 'DRAFT';
  const sent = quote.status === 'SENT';
  const expired = isQuoteExpired(quote.status, quote.validUntil);

  const confirmationContent = getQuoteConfirmationContent(confirmation);

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/quotes" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para orçamentos
      </Link>

      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{quote.title}</h1>

            <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {quote.customerName} · versão {quote.version}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={downloadingPdf}
            onClick={() => void handlePdf()}
            className="cursor-pointer"
          >
            {downloadingPdf ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="size-4" />
            )}
            PDF
          </Button>

          {approved && <QuoteWorkOrderAction organizationId={organizationId} quoteId={quote.id} />}

          {draft && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDetails(true)}
                className="cursor-pointer"
              >
                <Pencil aria-hidden="true" className="size-4" />
                Editar
              </Button>

              <Button
                type="button"
                disabled={quote.items.length === 0}
                onClick={() => setConfirmation({ kind: 'SEND' })}
                className="cursor-pointer"
              >
                <Send aria-hidden="true" className="size-4" />
                Marcar como enviado
              </Button>
            </>
          )}

          {sent && !expired && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmation({ kind: 'APPROVE' })}
                className="cursor-pointer"
              >
                <Check aria-hidden="true" className="size-4" />
                Registrar aprovação
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmation({ kind: 'DECLINE' })}
                className="cursor-pointer"
              >
                <X aria-hidden="true" className="size-4" />
                Registrar recusa
              </Button>
            </>
          )}

          {(draft || sent) && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmation({ kind: 'CANCEL' })}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {sent && !expired && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold">Compartilhar com o cliente</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Gere um link seguro para visualização, PDF, aprovação ou recusa.
              </p>
            </div>

            <div className="flex gap-2">
              {shareUrl && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={sharing}
                  onClick={() => void handleRevokeShare()}
                  className="cursor-pointer"
                >
                  Revogar link
                </Button>
              )}

              <Button
                type="button"
                disabled={sharing}
                onClick={() => void handleCreateShare()}
                className="cursor-pointer"
              >
                {sharing ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <ExternalLink aria-hidden="true" className="size-4" />
                )}

                {shareUrl ? 'Gerar novo link' : 'Gerar link'}
              </Button>
            </div>
          </div>

          {shareUrl && (
            <div className="mt-5 flex gap-2">
              <Input readOnly value={shareUrl} className="h-11 rounded-xl" />

              <Button
                type="button"
                variant="outline"
                onClick={() => void copyShareUrl(shareUrl)}
                className="cursor-pointer"
              >
                <Clipboard aria-hidden="true" className="size-4" />
                Copiar
              </Button>
            </div>
          )}

          {shareMessage && <p className="mt-3 text-sm text-muted-foreground">{shareMessage}</p>}
        </section>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-heading text-lg font-semibold">Itens do orçamento</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {quote.items.length} {quote.items.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            {draft && (
              <Button
                type="button"
                onClick={() => {
                  setEditingItem(undefined);
                  setItemPanelOpen(true);
                }}
                className="cursor-pointer"
              >
                <Plus aria-hidden="true" className="size-4" />
                Adicionar
              </Button>
            )}
          </div>

          {quote.items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />

              <p className="mt-3 text-sm text-muted-foreground">
                Adicione pelo menos um item antes de enviar o orçamento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {[...quote.items]
                .sort((left, right) => left.position - right.position)
                .map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)}
                          {' · '}
                          {formatBrlCurrency(item.unitAmountInCents)} por unidade
                        </p>

                        {item.description && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{formatBrlCurrency(item.totalInCents)}</p>

                        {draft && (
                          <div className="mt-2 flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingItem(item);
                                setItemPanelOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil aria-hidden="true" className="size-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setConfirmation({
                                  kind: 'REMOVE_ITEM',
                                  item,
                                })
                              }
                              className="cursor-pointer text-destructive"
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Resumo</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBrlCurrency(quote.subtotalInCents)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Desconto</span>
                <span>- {formatBrlCurrency(quote.discountInCents)}</span>
              </div>

              <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatBrlCurrency(quote.totalInCents)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Cliente</h2>

            <Link
              href={`/customers/${quote.customerId}`}
              className="mt-4 block font-medium hover:text-primary hover:underline"
            >
              {quote.customerName}
            </Link>

            {quote.customerEmail && <p className="mt-2 text-sm text-muted-foreground">{quote.customerEmail}</p>}

            {quote.customerPhone && <p className="mt-1 text-sm text-muted-foreground">{quote.customerPhone}</p>}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Detalhes</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Validade</dt>
                <dd className="mt-1 font-medium">{formatDateTime(quote.validUntil)}</dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Criado em</dt>
                <dd className="mt-1 font-medium">{formatDate(quote.createdAt)}</dd>
              </div>
            </dl>

            {quote.notes && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">Observações</p>

                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mt-5">
        <QuoteStatusHistory organizationId={organizationId} quoteId={quote.id} quoteVersion={quote.version} />
      </div>

      {editingDetails && (
        <QuoteDetailsFormPanel quote={quote} onClose={() => setEditingDetails(false)} onSaved={applyQuote} />
      )}

      {itemPanelOpen && (
        <QuoteItemFormPanel
          quote={quote}
          item={editingItem}
          onClose={() => {
            setEditingItem(undefined);
            setItemPanelOpen(false);
          }}
          onSaved={applyQuote}
        />
      )}

      {confirmation && confirmationContent && (
        <ConfirmationDialog
          title={confirmationContent.title}
          description={confirmationContent.description}
          confirmLabel={confirmationContent.confirmLabel}
          destructive={confirmationContent.destructive}
          loading={operationLoading}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void executeConfirmation()}
        />
      )}
    </div>
  );
}
