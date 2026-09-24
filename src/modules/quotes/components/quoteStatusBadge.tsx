import { cn } from '@/lib/utils';

import { getQuoteStatusLabel, isQuoteExpired } from '../constants/quote.constants';
import type { QuoteStatus } from '../types/quote.types';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  validUntil?: Date | null;
}

export function QuoteStatusBadge({ status, validUntil = null }: QuoteStatusBadgeProps) {
  const expired = isQuoteExpired(status, validUntil);

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-medium',
        status === 'DRAFT' && 'bg-muted text-muted-foreground',
        status === 'SENT' && !expired && 'bg-brand-muted text-primary',
        status === 'APPROVED' && 'bg-success-surface text-success',
        expired && 'bg-warning-surface text-warning',
        (status === 'DECLINED' || status === 'CANCELED') && 'bg-destructive/10 text-destructive',
      )}
    >
      {getQuoteStatusLabel(status, validUntil)}
    </span>
  );
}
