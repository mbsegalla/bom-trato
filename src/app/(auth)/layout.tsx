import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/brandLogo';
import { AuthBrandPanel } from '@/modules/auth/components/authBrandPanel';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

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
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <BrandLogo alt="" priority className="w-40" />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="mx-6 flex flex-wrap items-center justify-between gap-4 border-t border-border py-6 sm:mx-10">
          <Link href="/" aria-label="Bom Trato — página inicial">
            <BrandLogo alt="" className="w-28" />
          </Link>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Link href="/termos" className="hover:text-foreground">
              Termos de Uso
            </Link>

            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
