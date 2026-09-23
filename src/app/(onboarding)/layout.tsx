import Link from 'next/link';
import type { ReactNode } from 'react';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between px-6 lg:px-10">
          <Link
            href="/"
            aria-label="Bom Trato — página inicial"
            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-xl bg-brand text-xl font-bold tracking-tighter text-brand-foreground"
            >
              bt
            </span>

            <span className="text-xl font-bold tracking-tight">bom trato.</span>
          </Link>

          <p className="hidden text-sm text-muted-foreground sm:block">Configuração da sua conta</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14 lg:px-10">{children}</main>
    </div>
  );
}
