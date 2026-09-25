import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import type { JoinedOrganization } from '@/modules/organizations/types/organization.types';

import { getOrganizationRoleLabel, getUserInitials } from '../helpers/appSidebar.helper';

interface SidebarFooterProps {
  pathname: string;
  user: AuthUser;
  activeOrganization: JoinedOrganization;
  loggingOut: boolean;
  logoutError: string | null;
  onNavigate(): void;
  onLogout(): void;
}

export function SidebarFooter({
  pathname,
  user,
  activeOrganization,
  loggingOut,
  logoutError,
  onNavigate,
  onLogout,
}: SidebarFooterProps) {
  return (
    <div className="border-t border-sidebar-border p-4">
      <Link
        href="/settings"
        onClick={onNavigate}
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
          {getUserInitials(user.name)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{getOrganizationRoleLabel(activeOrganization.role)}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={loggingOut}
          aria-label="Sair"
          title="Sair"
          onClick={onLogout}
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
  );
}
