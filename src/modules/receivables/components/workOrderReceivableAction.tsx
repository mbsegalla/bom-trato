'use client';

import { LoaderCircle, WalletCards } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { listReceivables } from '@/modules/receivables/services/receivable.service';

interface WorkOrderReceivableActionProps {
  organizationId: string;
  workOrderId: string;
  title: string;
}

export function WorkOrderReceivableAction({ organizationId, workOrderId }: WorkOrderReceivableActionProps) {
  const router = useRouter();

  const checkingRef = useRef(false);

  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    if (checkingRef.current) {
      return;
    }

    checkingRef.current = true;
    setChecking(true);
    setError(null);

    try {
      const result = await listReceivables(organizationId, {
        page: 1,
        limit: 2,
        status: 'ALL',
        workOrderId,
      });

      if (result.items.length === 0) {
        setError('O recebível será gerado automaticamente conforme a condição de pagamento.');
        return;
      }

      if (result.items.length === 1) {
        router.push(`/receivables/${result.items[0].id}`);
        return;
      }

      router.push(`/receivables?workOrderId=${encodeURIComponent(workOrderId)}`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível verificar os recebíveis.');
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        disabled={checking}
        onClick={() => void handleClick()}
        className="cursor-pointer"
      >
        {checking ? <LoaderCircle className="size-4 animate-spin" /> : <WalletCards className="size-4" />}
        Ver recebíveis
      </Button>

      {error && <p className="mt-2 max-w-64 text-xs text-muted-foreground">{error}</p>}
    </div>
  );
}
