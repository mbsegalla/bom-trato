import type { Plan } from '@/modules/plans/types/plan.types';

export function getPlanFeatures(plan: Plan): string[] {
  return [
    plan.maxUsers === 1
      ? '1 usuário'
      : plan.maxUsers > 999
        ? 'Usuários ilimitados'
        : `${plan.maxUsers.toLocaleString('pt-BR')} usuários`,
    'Clientes, orçamentos e ordens de serviço',
    'Agenda de atendimentos',
    ...(plan.teamManagementEnabled ? ['Gestão de equipe habilitada'] : []),
  ];
}
