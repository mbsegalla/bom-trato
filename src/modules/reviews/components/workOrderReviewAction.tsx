'use client';

import { Check, LoaderCircle, Star } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { createReviewInvitation } from '../services/review.service';

interface WorkOrderReviewActionProps {
  organizationId: string;
  workOrderId: string;
}

export function WorkOrderReviewAction({ organizationId, workOrderId }: WorkOrderReviewActionProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(): Promise<void> {
    if (loading) {
      return;
    }

    setLoading(true);
    setCopied(false);
    setError(null);

    try {
      const invitation = await createReviewInvitation(organizationId, workOrderId);

      await navigator.clipboard.writeText(invitation.url);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 4000);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => void create()}
        className="cursor-pointer"
      >
        {loading ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : copied ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Star aria-hidden="true" className="size-4" />
        )}

        {copied ? 'Link copiado' : 'Pedir avaliação'}
      </Button>

      {error && <p className="mt-2 max-w-64 text-xs text-destructive">{error}</p>}
    </div>
  );
}
