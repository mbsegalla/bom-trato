'use client';

import { Download, FileText, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { workOrderWarrantyFormSchema } from '../../schemas/workOrderDocument.schema';
import {
  downloadWorkOrderReport,
  getWorkOrderWarranty,
  updateWorkOrderWarranty,
} from '../../services/workOrderDocument.service';
import type { WorkOrderWarrantyResult } from '../../types/workOrderDocument.types';

interface WorkOrderDocumentSectionProps {
  organizationId: string;
  workOrderId: string;
  status: string;
}

type DocumentState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: WorkOrderWarrantyResult }
  | { kind: 'error'; message: string };

export function WorkOrderDocumentSection({ organizationId, workOrderId, status }: WorkOrderDocumentSectionProps) {
  const router = useRouter();
  const [state, setState] = useState<DocumentState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [durationDays, setDurationDays] = useState('');
  const [terms, setTerms] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    void getWorkOrderWarranty(organizationId, workOrderId)
      .then((data) => {
        if (!active) {
          return;
        }

        setState({ kind: 'ready', data });
        setDurationDays(data.warranty === null ? '' : String(data.warranty.durationDays));
        setTerms(data.warranty?.terms ?? '');
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
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar o relatório.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, workOrderId, refreshVersion, router]);

  function refresh(): void {
    setState({ kind: 'loading' });
    setRefreshVersion((value) => value + 1);
  }

  async function handleSave(): Promise<void> {
    if (state.kind !== 'ready' || state.data.locked || saving) {
      return;
    }

    const parsed = workOrderWarrantyFormSchema.safeParse({ durationDays: Number(durationDays), terms });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Confira as condições de garantia.');
      return;
    }

    setSaving(true);

    try {
      const version = state.data.warranty?.version ?? 0;
      const data = await updateWorkOrderWarranty(organizationId, workOrderId, version, parsed.data);
      setState({ kind: 'ready', data });
      setDurationDays(String(data.warranty?.durationDays ?? parsed.data.durationDays));
      setTerms(data.warranty?.terms ?? parsed.data.terms);
      toast.success('Condições de garantia salvas.');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      toast.error(cause instanceof Error ? cause.message : 'Não foi possível salvar as condições.');
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(): Promise<void> {
    if (downloading) {
      return;
    }

    setDownloading(true);

    try {
      const file = await downloadWorkOrderReport(organizationId, workOrderId);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      toast.error(cause instanceof Error ? cause.message : 'Não foi possível baixar o relatório.');
    } finally {
      setDownloading(false);
    }
  }

  const ready = state.kind === 'ready' ? state.data : null;
  const locked = ready?.locked ?? true;
  const disabled = saving || locked;

  return (
    <section className="min-w-0 border-t border-border pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileText aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Relatório e garantia do serviço</h2>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Gere um relatório em PDF e informe as condições de garantia comercial oferecidas pela empresa.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={() => void handleDownload()} disabled={downloading}>
          {downloading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          Baixar relatório PDF
        </Button>
      </div>

      {state.kind === 'loading' && (
        <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Consultando as condições de garantia...
        </p>
      )}

      {state.kind === 'error' && (
        <div className="mt-6 space-y-3">
          <p role="alert" className="text-sm text-destructive">{state.message}</p>
          <Button type="button" variant="outline" onClick={refresh}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {ready !== null && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6">
          {locked && (
            <p className="mb-5 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              As condições de garantia não podem ser alteradas após o aceite da conclusão ou cancelamento da OS.
            </p>
          )}

          {status !== 'COMPLETED' && ready.warranty !== null && (
            <p className="mb-5 text-sm text-muted-foreground">
              O prazo começará a contar da conclusão da ordem de serviço.
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="work-order-warranty-days">Prazo em dias corridos</Label>
              <Input
                id="work-order-warranty-days"
                type="number"
                min={1}
                max={3650}
                placeholder="Ex.: 90"
                step={1}
                value={durationDays}
                disabled={disabled}
                onChange={(event) => setDurationDays(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-order-warranty-terms">Condições da garantia comercial</Label>
              <Textarea
                id="work-order-warranty-terms"
                rows={4}
                maxLength={2000}
                value={terms}
                disabled={disabled}
                onChange={(event) => setTerms(event.target.value)}
                placeholder="Descreva a cobertura, as exclusões e como solicitar atendimento."
              />
              <p className="text-xs text-muted-foreground">{terms.length}/2000 caracteres</p>
            </div>
          </div>

          {ready.warranty?.expiresAt && (
            <p className="mt-4 text-sm text-muted-foreground">
              Data de referência do término: {formatDateTime(ready.warranty.expiresAt)}
            </p>
          )}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            A garantia comercial deve ser informada expressamente. Nenhum prazo é concedido automaticamente,
            e as condições não afastam direitos legais do consumidor.
          </p>

          {!locked && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                Salvar condições
              </Button>
              <Button type="button" variant="outline" disabled={saving} onClick={refresh}>
                <RefreshCw aria-hidden="true" className="size-4" />
                Atualizar
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
