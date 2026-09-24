import type { LucideIcon } from 'lucide-react';

interface AppPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function AppPlaceholder({ icon: Icon, title, description }: AppPlaceholderProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-primary">
          <Icon aria-hidden="true" className="size-6" />
        </div>

        <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">{title}</h1>

        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
