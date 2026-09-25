'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout } from '@/modules/auth/services/session.service';

import { useApp } from '../appProvider';
import { OrganizationSwitcher } from './components/organizationSwitcher';
import { SidebarFooter } from './components/sidebarFooter';
import { SidebarNavigation } from './components/sidebarNavigation';

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose(): void;
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organizations, activeOrganization, switchingOrganization, switchOrganization } = useApp();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    if (loggingOut) return;

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

        <OrganizationSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization}
          switching={switchingOrganization}
          onSwitch={(id) => void switchOrganization(id)}
        />
        <SidebarNavigation pathname={pathname} onNavigate={onMobileClose} />
        <SidebarFooter
          pathname={pathname}
          user={user}
          activeOrganization={activeOrganization}
          loggingOut={loggingOut}
          logoutError={logoutError}
          onNavigate={onMobileClose}
          onLogout={() => void handleLogout()}
        />
      </aside>
    </>
  );
}
