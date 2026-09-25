'use client';

import { Bell, CalendarDays, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { formatLongDate } from '@/shared/formatters/date.formatter';

import { useApp } from './appProvider';

interface AppHeaderProps {
  onOpenNavigation(): void;
}

const pageNames: Record<string, string> = {
  '/dashboard': 'Visão geral',
  '/customers': 'Clientes',
  '/services-catalog': 'Catálogo de serviços',
  '/quotes': 'Orçamentos',
  '/work-orders': 'Ordens de serviço',
  '/schedule': 'Agendamentos',
  '/receivables': 'Recebíveis',
  '/settings': 'Configurações',
  '/billing': 'Faturamento',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function pageName(pathname: string): string {
  const match = Object.entries(pageNames).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));

  return match?.[1] ?? 'Bom Trato';
}

export function AppHeader({ onOpenNavigation }: AppHeaderProps) {
  const pathname = usePathname();

  const { user } = useApp();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex min-h-18 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Abrir navegação"
            onClick={onOpenNavigation}
            className="cursor-pointer lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </Button>

          <div className="flex min-w-0 items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">Seu negócio</span>

            <span className="hidden text-border sm:inline">/</span>

            <span className="truncate font-medium">{pageName(pathname)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <CalendarDays aria-hidden="true" className="size-4" />

            <span className="capitalize">{formatLongDate(new Date())}</span>
          </div>

          <Button type="button" variant="ghost" size="icon" aria-label="Notificações" className="cursor-pointer">
            <Bell aria-hidden="true" className="size-5" />
          </Button>

          <div
            title={user.name}
            className="flex size-10 items-center justify-center rounded-full bg-brand-muted text-sm font-semibold text-primary"
          >
            {initials(user.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
