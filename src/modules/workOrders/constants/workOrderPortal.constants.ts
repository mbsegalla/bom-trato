import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  PlayCircle,
  XCircle,
} from 'lucide-react';

import type { WorkOrderStatus } from '../types/workOrder.types';
import type { PublicWorkOrderTimelineEventType } from '../types/workOrderPortal.types';

interface PublicWorkOrderStatusContent {
  label: string;
  title: string;
  description: string;
}

interface PublicWorkOrderTimelineContent {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const publicWorkOrderStatusContent: Record<WorkOrderStatus, PublicWorkOrderStatusContent> = {
  OPEN: {
    label: 'Confirmado',
    title: 'Seu atendimento está confirmado.',
    description: 'O profissional está organizando os próximos passos. Você poderá acompanhar as atualizações por aqui.',
  },
  SCHEDULED: {
    label: 'Agendado',
    title: 'Tudo pronto para o seu atendimento.',
    description: 'Seu serviço já possui um agendamento. Confira a data e os horários informados pelo profissional.',
  },
  IN_PROGRESS: {
    label: 'Em andamento',
    title: 'Seu atendimento está em andamento.',
    description: 'O profissional iniciou a execução do serviço. Acompanhe as próximas atualizações por aqui.',
  },
  COMPLETED: {
    label: 'Concluído',
    title: 'Seu serviço foi concluído!',
    description:
      'O profissional registrou a conclusão do atendimento. Confira o histórico e o resumo dos serviços realizados.',
  },
  CANCELED: {
    label: 'Cancelado',
    title: 'Este atendimento foi cancelado.',
    description:
      'Entre em contato com o profissional responsável caso precise esclarecer informações sobre o cancelamento.',
  },
};

export const publicWorkOrderTimelineContent: Record<PublicWorkOrderTimelineEventType, PublicWorkOrderTimelineContent> =
  {
    QUOTE_APPROVED: {
      title: 'Orçamento aprovado',
      description: 'A proposta do serviço foi aprovada.',
      icon: FileCheck2,
    },
    WORK_ORDER_CREATED: {
      title: 'Atendimento confirmado',
      description: 'A ordem de serviço foi criada.',
      icon: ClipboardCheck,
    },
    WORK_ORDER_SCHEDULED: {
      title: 'Serviço agendado',
      description: 'O profissional definiu o agendamento do atendimento.',
      icon: CalendarCheck,
    },
    WORK_ORDER_RESCHEDULED: {
      title: 'Agendamento atualizado',
      description: 'O profissional atualizou os horários do atendimento.',
      icon: CalendarClock,
    },
    WORK_ORDER_STARTED: {
      title: 'Serviço iniciado',
      description: 'O profissional registrou o início da execução.',
      icon: PlayCircle,
    },
    WORK_ORDER_COMPLETED: {
      title: 'Serviço concluído',
      description: 'O profissional registrou a conclusão do serviço.',
      icon: CheckCircle2,
    },
    WORK_ORDER_CANCELED: {
      title: 'Serviço cancelado',
      description: 'O atendimento foi cancelado.',
      icon: XCircle,
    },
  };
