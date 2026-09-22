'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { marketingNavigation } from '../data/marketing.data';
import { MarketingLink } from './marketingLink';

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <Link
          href="/"
          aria-label="Bom Trato — página inicial"
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-brand text-xl font-bold tracking-tighter text-brand-foreground"
          >
            bt
          </span>

          <span className="text-xl font-bold tracking-tight">bom trato.</span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {marketingNavigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Entrar
          </Link>

          <MarketingLink href="#pricing">Conhecer os planos</MarketingLink>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="marketing-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="size-11 lg:hidden"
        >
          {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </Button>
      </div>

      <nav
        id="marketing-mobile-menu"
        aria-label="Navegação móvel"
        hidden={!menuOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setMenuOpen(false);
            document.querySelector<HTMLButtonElement>('[aria-controls="marketing-mobile-menu"]')?.focus();
          }
        }}
        className="border-t border-border px-6 pb-6 lg:hidden"
      >
        <ul className="py-3">
          {marketingNavigation.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-md text-sm focus-visible:outline-2 focus-visible:outline-ring"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <MarketingLink href="/login" variant="outline" onClick={() => setMenuOpen(false)} className="flex-1">
            Entrar
          </MarketingLink>

          <MarketingLink href="#pricing" onClick={() => setMenuOpen(false)} className="flex-1">
            Ver planos
          </MarketingLink>
        </div>
      </nav>
    </header>
  );
}
