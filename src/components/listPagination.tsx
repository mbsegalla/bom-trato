import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ListPaginationProps {
  page: number;
  hasMore: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function ListPagination({ page, hasMore, disabled = false, onPrevious, onNext }: ListPaginationProps) {
  return (
    <footer className="flex items-center justify-between gap-4 border-t border-border py-4">
      <p className="text-sm text-muted-foreground">Página {page}</p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          disabled={disabled || page <= 1}
          aria-label="Página anterior"
          title="Página anterior"
          onClick={onPrevious}
          className="cursor-pointer"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          disabled={disabled || !hasMore}
          aria-label="Próxima página"
          title="Próxima página"
          onClick={onNext}
          className="cursor-pointer"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </footer>
  );
}
