import Link from 'next/link';

import { cn } from '@/lib/utils';

import { appNavigation } from '../helpers/appSidebar.helper';

interface SidebarNavigationProps {
  pathname: string;
  onNavigate(): void;
}

export function SidebarNavigation({ pathname, onNavigate }: SidebarNavigationProps) {
  return (
    <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-4">
      <ul className="space-y-1">
        {appNavigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
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
  );
}
