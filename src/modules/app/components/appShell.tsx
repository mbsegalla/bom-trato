'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { AppHeader } from './appHeader';
import { AppSidebar } from './appSidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppSidebar mobileOpen={mobileNavigationOpen} onMobileClose={() => setMobileNavigationOpen(false)} />

      <div className="min-h-dvh lg:pl-72">
        <AppHeader onOpenNavigation={() => setMobileNavigationOpen(true)} />

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
