import { formatDateTime } from '@/shared/formatters/date.formatter';
import { isValidBrazilianPhone, normalizeBrazilianPhone } from '@/shared/formatters/phone.formatter';

import type { WorkOrder, WorkOrderStatus } from '../types/workOrder.types';

function getWorkOrderStatusMessage(workOrder: WorkOrder): string {
  const messages: Record<WorkOrderStatus, string> = {
    OPEN: `Seu atendimento de "${workOrder.title}" está confirmado!`,
    SCHEDULED: `Seu atendimento de "${workOrder.title}" está agendado!`,
    IN_PROGRESS: `O serviço de "${workOrder.title}" está em andamento.`,
    COMPLETED: `Seu serviço de "${workOrder.title}" foi concluído!`,
    CANCELED: `O atendimento de "${workOrder.title}" foi cancelado.`,
  };

  return messages[workOrder.status];
}

function getWorkOrderScheduleMessage(workOrder: WorkOrder): string[] {
  if (workOrder.status !== 'SCHEDULED' || workOrder.scheduledStartAt === null) {
    return [];
  }

  const message = [`Data e horário: ${formatDateTime(workOrder.scheduledStartAt)}`];

  if (workOrder.scheduledEndAt !== null) {
    message.push(`Término previsto: ${formatDateTime(workOrder.scheduledEndAt)}`);
  }

  return [...message, ''];
}

export function createWorkOrderShareWhatsAppMessage(
  workOrder: WorkOrder,
  organizationName: string,
  shareUrl: string,
): string {
  const firstName = workOrder.customerName.trim().split(/\s+/)[0];

  return [
    firstName ? `Olá, ${firstName}!` : 'Olá!',
    '',
    getWorkOrderStatusMessage(workOrder),
    '',
    ...getWorkOrderScheduleMessage(workOrder),
    'Preparamos um espaço exclusivo para você acompanhar as informações do seu atendimento.',
    '',
    'Acesse seu portal pelo link abaixo:',
    '',
    shareUrl,
    '',
    'Por segurança, compartilhe este link somente com pessoas autorizadas.',
    '',
    'Qualquer dúvida, estamos à disposição!',
    '',
    organizationName,
  ].join('\n');
}

export function createWorkOrderShareWhatsAppUrl(phone: string | null, message: string): string {
  const encodedMessage = encodeURIComponent(message);

  if (!phone || !isValidBrazilianPhone(phone)) {
    return `https://wa.me/?text=${encodedMessage}`;
  }

  const normalizedPhone = normalizeBrazilianPhone(phone);

  return `https://wa.me/55${normalizedPhone}?text=${encodedMessage}`;
}
