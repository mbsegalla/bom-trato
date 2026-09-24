'use client';

import {
  Banknote,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout } from '@/modules/auth/services/session.service';

import { useApp } from './appProvider';

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose(): void;
}

const navigation = [
  {
    label: 'Visão geral',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Clientes',
    href: '/customers',
    icon: Users,
  },
  {
    label: 'Catálogo de serviços',
    href: '/services-catalog',
    icon: Wrench,
  },
  {
    label: 'Orçamentos',
    href: '/quotes',
    icon: FileText,
  },
  {
    label: 'Ordens de serviço',
    href: '/work-orders',
    icon: ClipboardList,
  },
  {
    label: 'Agendamentos',
    href: '/schedule',
    icon: CalendarDays,
  },
  {
    label: 'Recebíveis',
    href: '/receivables',
    icon: Banknote,
  },
] as const;

function roleLabel(role: 'OWNER' | 'MEMBER'): string {
  return role === 'OWNER' ? 'Administrador' : 'Membro';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, organizations, activeOrganization, switchingOrganization, switchOrganization } = useApp();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();

      router.replace('/login');
    } catch (cause: unknown) {
      setLogoutError(cause instanceof Error ? cause.message : 'Não foi possível sair agora.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar navegação"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 cursor-pointer bg-foreground/20 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex min-h-20 items-center justify-between px-5">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-xl bg-brand text-xl font-bold tracking-tighter text-brand-foreground"
            >
              bt
            </span>

            <span className="text-xl font-bold tracking-tight">bom trato.</span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar navegação"
            onClick={onMobileClose}
            className="cursor-pointer lg:hidden"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        <div className="px-4 pb-5">
          <div className="relative rounded-2xl border border-sidebar-border bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
                <Store aria-hidden="true" className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <label htmlFor="active-organization" className="sr-only">
                  Negócio ativo
                </label>

                <div className="relative">
                  <select
                    id="active-organization"
                    value={activeOrganization.id}
                    disabled={switchingOrganization}
                    onChange={(event) => void switchOrganization(event.target.value)}
                    className="w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm font-semibold outline-none disabled:cursor-wait"
                  >
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>

                  {organizations.length > 1 && (
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  )}
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">{roleLabel(activeOrganization.role)}</p>
              </div>
            </div>
          </div>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5" />

                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={cn(
              'mb-4 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent/60',
            )}
          >
            <Settings aria-hidden="true" className="size-5" />
            Configurações
          </Link>

          <div className="flex items-center gap-3 px-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-semibold text-primary">
              {initials(user.name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>

              <p className="truncate text-xs text-muted-foreground">{roleLabel(activeOrganization.role)}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={loggingOut}
              aria-label="Sair"
              title="Sair"
              onClick={() => void handleLogout()}
              className="cursor-pointer"
            >
              <LogOut aria-hidden="true" className="size-4" />
            </Button>
          </div>

          {logoutError && (
            <p role="alert" className="mt-3 px-2 text-xs leading-relaxed text-destructive">
              {logoutError}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
