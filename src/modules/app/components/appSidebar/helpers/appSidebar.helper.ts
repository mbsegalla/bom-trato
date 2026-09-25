import { Banknote, CalendarDays, ClipboardList, FileText, LayoutDashboard, Users, Wrench } from 'lucide-react';

import type { OrganizationRole } from '@/modules/organizations/types/organization.types';

export const appNavigation = [
  { label: 'Visão geral', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/customers', icon: Users },
  { label: 'Catálogo de serviços', href: '/services-catalog', icon: Wrench },
  { label: 'Orçamentos', href: '/quotes', icon: FileText },
  { label: 'Ordens de serviço', href: '/work-orders', icon: ClipboardList },
  { label: 'Agendamentos', href: '/schedule', icon: CalendarDays },
  { label: 'Recebíveis', href: '/receivables', icon: Banknote },
] as const;

export function getOrganizationRoleLabel(role: OrganizationRole): string {
  return role === 'OWNER' ? 'Administrador' : 'Membro';
}

export function getUserInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
