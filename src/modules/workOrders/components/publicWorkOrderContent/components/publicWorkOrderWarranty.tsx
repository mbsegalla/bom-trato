'use client';

import { Download, FileCheck2, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { downloadPublicWorkOrderReport } from '../../../services/publicWorkOrderReport.service';
import type { PublicWorkOrder } from '../../../types/workOrderPortal.types';

interface PublicWorkOrderWarrantyProps {
  portal: PublicWorkOrder;
  token: string;
}

export function PublicWorkOrderWarranty({ portal, token }: PublicWorkOrderWarrantyProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (portal.workOrder.status !== 'COMPLETED') {
    return null;
  }

  async function handleDownload(): Promise<void> {
    if (downloading || new URLSearchParams(window.location.hash.slice(1)).get('token') !== token) {
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const blob = await downloadPublicWorkOrderReport(token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = 'relatorio-atendimento.pdf';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível baixar o documento.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileCheck2 aria-hidden="true" className="size-5" />
        </div>

        <h2 className="font-heading text-xl font-semibold">Relatório e garantia do serviço</h2>
      </div>

      {portal.warranty === null ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Nenhuma garantia comercial adicional foi informada neste atendimento.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold">{portal.warranty.durationDays} dias de garantia comercial informada</p>
          <p className="text-sm text-muted-foreground">
            Data de referência do término: {formatDateTime(portal.warranty.expiresAt)}
          </p>
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
            {portal.warranty.terms}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            As condições comerciais informadas não afastam os direitos legais do consumidor.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={downloading}
        onClick={() => void handleDownload()}
        className="mt-5 min-h-11 cursor-pointer"
      >
        {downloading ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Download aria-hidden="true" className="size-4" />
        )}
        Baixar relatório do atendimento
      </Button>

      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
