'use client';

import { Clipboard, ExternalLink, Link2, LoaderCircle, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatDateTime } from '@/shared/formatters/date.formatter';
import { formatBrazilianPhone, isValidBrazilianPhone } from '@/shared/formatters/phone.formatter';

import {
  createWorkOrderShareWhatsAppMessage,
  createWorkOrderShareWhatsAppUrl,
} from '../../../helpers/workOrderShareWhatsapp.helper';
import {
  createWorkOrderShare,
  getWorkOrderShare,
  revokeWorkOrderShare,
} from '../../../services/workOrderPortal.service';
import type { WorkOrder } from '../../../types/workOrder.types';
import type { WorkOrderShareDuration, WorkOrderShareStatus } from '../../../types/workOrderPortal.types';

type ShareOperation = 'CREATE' | 'REVOKE';

type ShareState =
  | {
      kind: 'loading';
    }
  | {
      kind: 'ready';
      share: WorkOrderShareStatus | null;
      url: string | null;
    }
  | {
      kind: 'error';
      message: string;
    };

interface WorkOrderShareSectionProps {
  workOrder: WorkOrder;
}

const shareDurations: WorkOrderShareDuration[] = [7, 15, 30];

const MAX_TIMEOUT_MS = 2_147_483_647;

const confirmationContent = {
  CREATE: {
    title: 'Gerar um novo link?',
    description:
      'O link anterior será invalidado. Será necessário enviar o novo endereço ao cliente para que ele continue acompanhando o atendimento.',
    confirmLabel: 'Gerar novo link',
    destructive: false,
  },
  REVOKE: {
    title: 'Revogar compartilhamento?',
    description:
      'O cliente deixará de conseguir consultar o atendimento através do link atual. Você poderá gerar outro compartilhamento posteriormente.',
    confirmLabel: 'Revogar acesso',
    destructive: true,
  },
} satisfies Record<
  ShareOperation,
  {
    title: string;
    description: string;
    confirmLabel: string;
    destructive: boolean;
  }
>;

export function WorkOrderShareSection({ workOrder }: WorkOrderShareSectionProps) {
  const router = useRouter();
  const { activeOrganization } = useApp();

  const { organizationId, id: workOrderId, customerPhone } = workOrder;

  const [state, setState] = useState<ShareState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [duration, setDuration] = useState<WorkOrderShareDuration>(7);
  const [pending, setPending] = useState<ShareOperation | null>(null);
  const [confirmation, setConfirmation] = useState<ShareOperation | null>(null);

  const hasValidPhone = customerPhone !== null && isValidBrazilianPhone(customerPhone);

  useEffect(() => {
    let active = true;

    void getWorkOrderShare(organizationId, workOrderId)
      .then((share) => {
        if (!active) {
          return;
        }

        setState({
          kind: 'ready',
          share,
          url: null,
        });
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
          message: cause instanceof Error ? cause.message : 'Não foi possível consultar o compartilhamento.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, workOrderId, refreshVersion, router]);

  useEffect(() => {
    if (pending !== null || state.kind !== 'ready' || state.share === null) {
      return;
    }

    const remaining = state.share.expiresAt.getTime() - Date.now();

    const timeout = window.setTimeout(
      () => {
        setConfirmation(null);
        setState({ kind: 'loading' });
        setRefreshVersion((value) => value + 1);
      },
      Math.max(60_000, Math.min(remaining, MAX_TIMEOUT_MS)),
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state, pending]);

  function refresh(): void {
    setState({
      kind: 'loading',
    });

    setRefreshVersion((value) => value + 1);
  }

  async function executeOperation(operation: ShareOperation): Promise<void> {
    if (pending !== null || state.kind !== 'ready') {
      return;
    }

    setPending(operation);

    try {
      if (operation === 'REVOKE') {
        await revokeWorkOrderShare(organizationId, workOrderId);

        setState({
          kind: 'ready',
          share: null,
          url: null,
        });

        toast.success('Compartilhamento revogado.');

        return;
      }

      const { url, ...share } = await createWorkOrderShare(organizationId, workOrderId, workOrder.version, duration);

      setState({
        kind: 'ready',
        share,
        url,
      });

      toast.success('Link de acompanhamento gerado com sucesso.');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      const message = cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.';

      setState({
        kind: 'error',
        message,
      });

      toast.error(message);
    } finally {
      setPending(null);
      setConfirmation(null);
    }
  }

  function handleCreate(): void {
    if (state.kind !== 'ready' || pending !== null) {
      return;
    }

    if (state.share !== null) {
      setConfirmation('CREATE');

      return;
    }

    void executeOperation('CREATE');
  }

  async function handleCopy(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);

      toast.success('Link copiado com sucesso.');
    } catch {
      toast.error('Não foi possível copiar automaticamente. Selecione e copie o endereço manualmente.');
    }
  }

  function handleWhatsApp(url: string): void {
    if (pending !== null || state.kind !== 'ready' || state.share === null || state.url !== url) {
      return;
    }

    if (activeOrganization.id !== organizationId) {
      return;
    }

    if (state.share.expiresAt.getTime() <= Date.now()) {
      toast.error('O prazo de validade do link terminou. Consulte o compartilhamento novamente.');
      refresh();

      return;
    }

    const message = createWorkOrderShareWhatsAppMessage(workOrder, activeOrganization.name, url);
    const whatsappUrl = createWorkOrderShareWhatsAppUrl(customerPhone, message);

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  function renderContent() {
    if (state.kind === 'loading') {
      return (
        <div aria-busy="true" aria-label="Consultando compartilhamento" className="mt-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      );
    }

    if (state.kind === 'error') {
      return (
        <div className="mt-5">
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive"
          >
            {state.message}
          </p>

          <Button type="button" variant="outline" onClick={refresh} className="mt-3 min-h-10 w-full cursor-pointer">
            <RefreshCw aria-hidden="true" className="size-4" />
            Consultar novamente
          </Button>
        </div>
      );
    }

    const { share, url } = state;

    const sharing = pending !== null;

    return (
      <div className="mt-5 space-y-4">
        {share !== null && (
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />

              <p className="text-sm font-semibold">Compartilhamento ativo</p>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Válido até {formatDateTime(share.expiresAt)}
            </p>
          </div>
        )}

        {share !== null && url === null && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Por segurança, o endereço original não pode ser recuperado. Caso não tenha guardado o link, gere outro
            compartilhamento.
          </p>
        )}

        {share === null && (
          <div className="rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-medium">Nenhum link ativo</p>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Gere um endereço privado para que o cliente possa acompanhar o atendimento sem criar uma conta.
            </p>
          </div>
        )}

        {url !== null && (
          <div className="space-y-3">
            <div>
              <label htmlFor="work-order-portal-url" className="text-xs font-medium">
                Link de acompanhamento
              </label>

              <Input
                id="work-order-portal-url"
                value={url}
                readOnly
                autoComplete="off"
                spellCheck={false}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-2 h-10 text-xs"
              />
            </div>

            <Button
              type="button"
              disabled={sharing}
              onClick={() => handleWhatsApp(url)}
              className="min-h-11 w-full cursor-pointer"
            >
              <MessageCircle aria-hidden="true" className="size-4" />

              {hasValidPhone ? 'Enviar pelo WhatsApp' : 'Escolher contato no WhatsApp'}
            </Button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {hasValidPhone
                ? `Destinatário: ${formatBrazilianPhone(customerPhone)}`
                : 'Cliente sem telefone válido. Confira e selecione o destinatário no WhatsApp.'}
            </p>

            <Button
              type="button"
              variant="outline"
              disabled={sharing}
              onClick={() => void handleCopy(url)}
              className="min-h-11 w-full cursor-pointer"
            >
              <Clipboard aria-hidden="true" className="size-4" />
              Copiar link
            </Button>

            {!sharing && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                Abrir portal
              </a>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              Copie ou compartilhe o endereço antes de sair desta página. O token não poderá ser recuperado posteriormente.
            </p>
          </div>
        )}

        <fieldset disabled={sharing}>
          <legend className="text-xs font-medium">Validade do novo link</legend>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {shareDurations.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                aria-pressed={duration === option}
                onClick={() => setDuration(option)}
                className={cn(
                  'min-h-10 cursor-pointer px-2 text-xs',
                  duration === option && 'border-primary bg-primary/5 text-primary',
                )}
              >
                {option} dias
              </Button>
            ))}
          </div>
        </fieldset>

        <Button
          type="button"
          variant={share === null ? 'default' : 'outline'}
          disabled={sharing}
          onClick={handleCreate}
          className="min-h-11 w-full cursor-pointer"
        >
          {pending === 'CREATE' ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Link2 aria-hidden="true" className="size-4" />
          )}

          {share === null ? 'Gerar link de acompanhamento' : 'Gerar novo link'}
        </Button>

        {share !== null && (
          <Button
            type="button"
            variant="ghost"
            disabled={sharing}
            onClick={() => setConfirmation('REVOKE')}
            className="min-h-10 w-full cursor-pointer text-destructive hover:text-destructive"
          >
            {pending === 'REVOKE' && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            Revogar acesso
          </Button>
        )}
      </div>
    );
  }

  const dialog = confirmation === null ? null : confirmationContent[confirmation];

  return (
    <section aria-labelledby="work-order-share-title">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Link2 aria-hidden="true" className="size-5" />
        </div>

        <div>
          <h2 id="work-order-share-title" className="font-heading text-lg font-semibold tracking-tight">
            Portal do Cliente
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Ofereça ao seu cliente uma experiência profissional de acompanhamento.
          </p>
        </div>
      </div>

      {renderContent()}

      {confirmation !== null && dialog !== null && (
        <ConfirmationDialog
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          destructive={dialog.destructive}
          loading={pending !== null}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void executeOperation(confirmation)}
        />
      )}
    </section>
  );
}
