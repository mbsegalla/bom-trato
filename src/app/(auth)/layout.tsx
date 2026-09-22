import Link from 'next/link';
import type { ReactNode } from 'react';

import { AuthBrandPanel } from '@/modules/auth/components/authBrandPanel';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="px-6 pt-8 sm:px-10 lg:hidden">
          <Link
            href="/"
            aria-label="Bom Trato — página inicial"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md text-2xl font-semibold tracking-tight text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            bom trato.
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="mx-6 flex flex-wrap items-center justify-between gap-3 border-t border-border py-6 sm:mx-10">
          <span className="text-sm font-semibold tracking-tight">bom trato.</span>

          <span className="text-xs text-muted-foreground">Trabalho de gente que faz a diferença.</span>
        </footer>
      </div>
    </div>
  );
}
