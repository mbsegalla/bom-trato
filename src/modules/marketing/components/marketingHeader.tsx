'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { BrandLogo } from '@/components/brandLogo';
import { Button } from '@/components/ui/button';

import { marketingNavigation, marketingTrial } from '../data/marketing.data';
import { MarketingLink } from './marketingLink';

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleOnKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      document.querySelector<HTMLButtonElement>('[aria-controls="marketing-mobile-menu"]')?.focus();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-6 lg:px-10">
        <Link
          href="/"
          aria-label="Bom Trato — página inicial"
          className="flex shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <BrandLogo alt="" priority className="w-36 sm:w-44" />
        </Link>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-4 xl:gap-6">
            {marketingNavigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-sm text-sm whitespace-nowrap text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Entrar
          </Link>

          <MarketingLink href={marketingTrial.href}>{marketingTrial.shortLabel}</MarketingLink>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <MarketingLink href={marketingTrial.href} className="hidden min-h-10 px-4 py-2 sm:inline-flex">
            {marketingTrial.shortLabel}
          </MarketingLink>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="size-11"
          >
            {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </Button>
        </div>
      </div>

      <nav
        id="marketing-mobile-menu"
        aria-label="Navegação móvel"
        hidden={!menuOpen}
        onKeyDown={handleOnKeyDown}
        className="border-t border-border px-6 pb-6 lg:hidden"
      >
        <ul className="py-3">
          {marketingNavigation.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground">
          <p className="text-sm font-semibold">Experimente por 14 dias grátis</p>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Sem cartão de crédito e sem cobrança automática.
          </p>

          <MarketingLink href={marketingTrial.href} onClick={() => setMenuOpen(false)} className="mt-4 w-full">
            {marketingTrial.shortLabel}
          </MarketingLink>
        </div>

        <MarketingLink href="/login" variant="outline" onClick={() => setMenuOpen(false)} className="mt-3 w-full">
          Entrar na minha conta
        </MarketingLink>
      </nav>
    </header>
  );
}
