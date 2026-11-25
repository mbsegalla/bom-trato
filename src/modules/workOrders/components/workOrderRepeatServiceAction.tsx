'use client';

import { Repeat2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { SessionError } from '@/modules/auth/services/session.service';
import { repeatWorkOrderQuote } from '@/modules/quotes/services/quote.service';

import type { WorkOrder } from '../types/workOrder.types';

interface WorkOrderRepeatServiceActionProps {
  workOrder: WorkOrder;
}

type RepeatState =
  | { kind: 'idle' }
  | { kind: 'confirming' }
  | { kind: 'pending' }
  | { kind: 'created'; quoteId: string }
  | { kind: 'uncertain' };

export function WorkOrderRepeatServiceAction({ workOrder }: WorkOrderRepeatServiceActionProps) {
  const router = useRouter();
  const activeRef = useRef(false);
  const submittingRef = useRef(false);
  const [state, setState] = useState<RepeatState>({ kind: 'idle' });

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
    };
  }, []);

  async function repeat(): Promise<void> {
    if (submittingRef.current || state.kind !== 'confirming' || workOrder.status !== 'COMPLETED') {
      return;
    }

    submittingRef.current = true;
    setState({ kind: 'pending' });

    try {
      const quote = await repeatWorkOrderQuote(workOrder.organizationId, workOrder.quoteId);

      if (!activeRef.current) {
        return;
      }

      setState({ kind: 'created', quoteId: quote.id });
      toast.success('Novo orçamento criado. Revise os valores e as condições antes de enviar.');
      router.push(`/quotes/${quote.id}`);
    } catch (cause: unknown) {
      if (!activeRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      toast.error(cause instanceof Error ? cause.message : 'Não foi possível confirmar a criação do orçamento.');
      setState({ kind: 'uncertain' });
    } finally {
      submittingRef.current = false;
    }
  }

  if (workOrder.status !== 'COMPLETED') {
    return null;
  }

  if (state.kind === 'created') {
    return (
      <Link href={`/quotes/${state.quoteId}`} className="text-sm font-medium text-primary underline underline-offset-4">
        Abrir novo orçamento
      </Link>
    );
  }

  if (state.kind === 'uncertain') {
    return (
      <div role="status" className="max-w-xs rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <p className="text-muted-foreground">
          Não foi possível confirmar a criação. Confira seus orçamentos antes de tentar novamente.
        </p>
        <Link href="/quotes" className="mt-2 inline-block font-medium text-primary underline underline-offset-4">
          Consultar orçamentos
        </Link>
      </div>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={state.kind === 'pending'}
        onClick={() => setState({ kind: 'confirming' })}
        className="cursor-pointer"
      >
        <Repeat2 aria-hidden="true" className="size-4" />
        Repetir serviço
      </Button>

      {(state.kind === 'confirming' || state.kind === 'pending') && (
        <ConfirmationDialog
          title="Repetir serviço?"
          description="Criaremos um novo orçamento com os serviços, valores anteriores e condições de pagamento. Revise os preços antes de enviar. Nenhuma cobrança ou agendamento será criado agora."
          confirmLabel="Criar orçamento"
          loading={state.kind === 'pending'}
          onCancel={() => {
            if (!submittingRef.current) {
              setState({ kind: 'idle' });
            }
          }}
          onConfirm={() => void repeat()}
        />
      )}
    </>
  );
}
