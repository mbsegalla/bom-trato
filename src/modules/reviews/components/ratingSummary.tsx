import { Star } from 'lucide-react';

interface RatingSummaryProps {
  average: number | null;
  count: number;
  compact?: boolean;
}

export function RatingSummary({ average, count, compact = false }: RatingSummaryProps) {
  if (average === null || count === 0) {
    return <span className="text-sm text-muted-foreground">Novo no Bom Trato</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <Star aria-hidden="true" fill="currentColor" className="size-4 text-primary" />

      <span className="font-semibold tabular-nums">{average.toFixed(1)}</span>

      <span className="text-sm text-muted-foreground">
        {compact ? `(${count})` : `(${count} ${count === 1 ? 'avaliação' : 'avaliações'})`}
      </span>
    </span>
  );
}
