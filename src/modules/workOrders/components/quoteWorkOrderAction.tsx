'use client';

import { ClipboardList, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { createWorkOrderFromQuote } from '../services/workOrder.service';

interface QuoteWorkOrderActionProps {
  organizationId: string;
  quoteId: string;
}

export function QuoteWorkOrderAction({ organizationId, quoteId }: QuoteWorkOrderActionProps) {
  const router = useRouter();

  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const workOrder = await createWorkOrderFromQuote(organizationId, quoteId);

      router.push(`/work-orders/${workOrder.id}`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a ordem de serviço.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Button type="button" disabled={submitting} onClick={() => void handleClick()} className="cursor-pointer">
        {submitting ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ClipboardList aria-hidden="true" className="size-4" />
        )}
        Abrir ordem de serviço
      </Button>

      {error && <p className="mt-2 max-w-64 text-xs text-destructive">{error}</p>}
    </div>
  );
}
