import { Button } from '@/components/ui/button';
import { quoteStatusOptions } from '@/modules/quotes/constants/quote.constants';
import type { QuoteListStatus } from '@/modules/quotes/types/quote.types';

interface QuotesFiltersProps {
  status: QuoteListStatus;
  onChange: (status: QuoteListStatus) => void;
}

export function QuotesFilters({ status, onChange }: QuotesFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-5">
      {quoteStatusOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={status === option.value ? 'default' : 'ghost'}
          onClick={() => onChange(option.value)}
          className="cursor-pointer rounded-lg"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
