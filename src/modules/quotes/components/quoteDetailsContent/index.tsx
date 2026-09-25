'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { QuoteDetailsFormPanel } from '@/modules/quotes/components/quoteDetailsFormPanel';
import { QuoteItemFormPanel } from '@/modules/quotes/components/quoteItemFormPanel';
import { QuoteStatusHistory } from '@/modules/quotes/components/quoteStatusHistory';
import { isQuoteExpired } from '@/modules/quotes/constants/quote.constants';
import type { QuoteConfirmation } from '@/modules/quotes/helpers/quoteConfirmation.helper';
import { getQuoteConfirmationContent } from '@/modules/quotes/helpers/quoteConfirmation.helper';
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
} from '@/modules/quotes/services/quote.service';
import type { Quote, QuoteItem } from '@/modules/quotes/types/quote.types';

import { QuoteDetailsHeader } from './components/quoteDetailsHeader';
import { QuoteItemsSection } from './components/quoteItemsSection';
import { QuoteShareSection } from './components/quoteShareSection';
import { QuoteSummarySidebar } from './components/quoteSummarySidebar';

export function QuoteDetailsContent({ quoteId }: { quoteId: string }) {
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
        if (active) {
          setLoadError(null);
          setQuote(result);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;

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
    if (!quote || !confirmation || operationLoading) return;

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
    if (!quote || downloadingPdf) return;

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
    if (!quote || sharing) return;

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
    if (!quote || sharing) return;

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

  if (loadError)
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
  if (!quote) return <DetailContentSkeleton label="Carregando orçamento" />;

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
      <QuoteDetailsHeader
        quote={quote}
        organizationId={organizationId}
        draft={draft}
        sent={sent}
        approved={approved}
        expired={expired}
        downloadingPdf={downloadingPdf}
        onPdf={() => void handlePdf()}
        onEdit={() => setEditingDetails(true)}
        onSend={() => setConfirmation({ kind: 'SEND' })}
        onApprove={() => setConfirmation({ kind: 'APPROVE' })}
        onDecline={() => setConfirmation({ kind: 'DECLINE' })}
        onCancel={() => setConfirmation({ kind: 'CANCEL' })}
      />

      {actionError && (
        <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {sent && !expired && (
        <QuoteShareSection
          shareUrl={shareUrl}
          shareMessage={shareMessage}
          sharing={sharing}
          onCreate={() => void handleCreateShare()}
          onRevoke={() => void handleRevokeShare()}
          onCopy={(url) => void copyShareUrl(url)}
        />
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <QuoteItemsSection
          quote={quote}
          draft={draft}
          onAdd={() => {
            setEditingItem(undefined);
            setItemPanelOpen(true);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setItemPanelOpen(true);
          }}
          onRemove={(item) => setConfirmation({ kind: 'REMOVE_ITEM', item })}
        />
        <QuoteSummarySidebar quote={quote} />
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
