import { TabButton } from '@/components/ui/tabButton';
import { quoteStatusOptions } from '@/modules/quotes/constants/quote.constants';
import type { QuoteListStatus } from '@/modules/quotes/types/quote.types';

interface QuotesFiltersProps {
  status: QuoteListStatus;
  onChange: (status: QuoteListStatus) => void;
}

export function QuotesFilters({ status, onChange }: QuotesFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Status dos orçamentos"
      className="flex flex-wrap gap-x-5 gap-y-2 border-y border-border py-4"
    >
      {quoteStatusOptions.map((option) => (
        <TabButton
          key={option.value}
          type="button"
          size="sm"
          active={status === option.value}
          aria-pressed={status === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </TabButton>
      ))}
    </div>
  );
}
