import { BrandLogo } from '@/components/brandLogo';

import type { ProductTourId } from '../data/productTour.data';
import { ProductTourScreen } from './productTourScreen';
import { ProductTourSidebar } from './productTourSidebar';

interface ProductTourShellProps {
  activeId: ProductTourId;
  onSelect(id: ProductTourId): void;
}

export function ProductTourShell({ activeId, onSelect }: ProductTourShellProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl shadow-brand/10">
      <div className="flex h-12 items-center gap-1.5 border-b border-border bg-muted/30 px-4">
        <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/50" />
        <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/35" />
        <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/20" />

        <span className="ml-3 truncate text-xs text-muted-foreground">app.bomtrato.com.br</span>
      </div>

      <div className="md:grid md:grid-cols-[12rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-muted/15 p-4 md:block">
          <div className="flex h-10 items-center">
            <BrandLogo alt="" className="w-28" />
          </div>

          <div className="mt-5">
            <ProductTourSidebar activeId={activeId} onSelect={onSelect} />
          </div>
        </aside>

        <div className="min-h-128 min-w-0 p-4 sm:p-6">
          <div key={activeId} aria-live="polite">
            <ProductTourScreen activeId={activeId} />
          </div>
        </div>
      </div>
    </div>
  );
}
