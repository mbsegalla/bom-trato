import type { WorkOrderListStatus, WorkOrderStatus } from '../types/workOrder.types';

export const workOrderStatusOptions: {
  value: WorkOrderListStatus;
  label: string;
}[] = [
  {
    value: 'ALL',
    label: 'Todos',
  },
  {
    value: 'OPEN',
    label: 'Abertos',
  },
  {
    value: 'SCHEDULED',
    label: 'Agendados',
  },
  {
    value: 'IN_PROGRESS',
    label: 'Em andamento',
  },
  {
    value: 'COMPLETED',
    label: 'Concluídos',
  },
  {
    value: 'CANCELED',
    label: 'Cancelados',
  },
];

export function getWorkOrderStatusLabel(status: WorkOrderStatus): string {
  switch (status) {
    case 'OPEN':
      return 'Aberta';

    case 'SCHEDULED':
      return 'Agendada';

    case 'IN_PROGRESS':
      return 'Em andamento';

    case 'COMPLETED':
      return 'Concluída';

    case 'CANCELED':
      return 'Cancelada';
  }
}

export function isWorkOrderPlanningEditable(status: WorkOrderStatus): boolean {
  return status === 'OPEN' || status === 'SCHEDULED';
}

export function canCancelWorkOrder(status: WorkOrderStatus): boolean {
  return status !== 'COMPLETED' && status !== 'CANCELED';
}
