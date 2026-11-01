import { type ProductTourId, productTourItems } from '../data/productTour.data';

interface ProductTourSidebarProps {
  activeId: ProductTourId;
  onSelect(id: ProductTourId): void;
}

export function ProductTourSidebar({ activeId, onSelect }: ProductTourSidebarProps) {
  return (
    <nav aria-label="Áreas do Bom Trato">
      <ul className="space-y-1">
        {productTourItems.map(({ id, label, icon: Icon }) => {
          const active = id === activeId;

          return (
            <li key={id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect(id)}
                className={
                  active
                    ? 'grid min-h-10 w-full cursor-pointer grid-cols-[1rem_minmax(0,1fr)] items-center gap-2.5 rounded-lg bg-secondary px-3 py-2 text-left text-xs font-medium text-secondary-foreground'
                    : 'grid min-h-10 w-full cursor-pointer grid-cols-[1rem_minmax(0,1fr)] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                }
              >
                <span className="flex size-4 items-center justify-center">
                  <Icon aria-hidden="true" className="size-4" strokeWidth={1.7} />
                </span>

                <span className="leading-snug">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
