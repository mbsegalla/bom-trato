'use client';

import { LoaderCircle, WalletCards } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ReceivableCreatePanel } from '@/modules/receivables/components/receivableCreatePanel';
import { findReceivableByWorkOrderId } from '@/modules/receivables/services/receivable.service';

interface WorkOrderReceivableActionProps {
  organizationId: string;
  workOrderId: string;
  title: string;
}

export function WorkOrderReceivableAction({ organizationId, workOrderId, title }: WorkOrderReceivableActionProps) {
  const router = useRouter();

  const checkingRef = useRef(false);

  const [checking, setChecking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    if (checkingRef.current) {
      return;
    }

    checkingRef.current = true;
    setChecking(true);
    setError(null);

    try {
      const existing = await findReceivableByWorkOrderId(organizationId, workOrderId);

      if (existing) {
        router.push(`/receivables/${existing.id}`);
        return;
      }

      setCreateOpen(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível verificar o recebível.');
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }

  return (
    <>
      <div>
        <Button type="button" disabled={checking} onClick={() => void handleClick()} className="cursor-pointer">
          {checking ? <LoaderCircle className="size-4 animate-spin" /> : <WalletCards className="size-4" />}
          Recebível
        </Button>

        {error && <p className="mt-2 max-w-64 text-xs text-destructive">{error}</p>}
      </div>

      {createOpen && (
        <ReceivableCreatePanel
          organizationId={organizationId}
          workOrderId={workOrderId}
          title={title}
          onClose={() => setCreateOpen(false)}
          onCreated={(receivable) => router.push(`/receivables/${receivable.id}`)}
        />
      )}
    </>
  );
}
