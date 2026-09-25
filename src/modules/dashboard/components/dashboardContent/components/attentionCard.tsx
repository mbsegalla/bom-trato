import { AlertTriangle, ArrowRight, CircleCheck } from 'lucide-react';
import Link from 'next/link';

export interface DashboardAttentionItem {
  id: string;
  label: string;
  href: string;
}

interface AttentionCardProps {
  items: DashboardAttentionItem[];
}

export function AttentionCard({ items }: AttentionCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle aria-hidden="true" className="size-5 text-warning" />
          <h2 className="font-heading text-lg font-semibold">Precisa da sua atenção</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <CircleCheck aria-hidden="true" className="mx-auto size-8 text-success" />
          <p className="mt-3 text-sm text-muted-foreground">Tudo em ordem por aqui.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between gap-4 py-4 text-sm font-medium hover:text-primary"
            >
              <span>{item.label}</span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
