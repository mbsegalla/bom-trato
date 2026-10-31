import { isValidBrazilianPhone, normalizeBrazilianPhone } from '@/shared/formatters/phone.formatter';

import type { WorkOrder } from '../types/workOrder.types';

export function createWorkOrderReviewUrl(token: string): string {
  const url = new URL('/avaliar', window.location.origin);

  url.hash = new URLSearchParams({ token }).toString();

  return url.toString();
}

export function createWorkOrderReviewWhatsAppMessage(
  workOrder: WorkOrder,
  organizationName: string,
  reviewUrl: string,
): string {
  return [
    `Olá, ${workOrder.customerName}!`,
    '',
    `O serviço "${workOrder.title}" foi concluído.`,
    '',
    `Sua opinião é muito importante para ${organizationName}.`,
    '',
    'Você pode avaliar o atendimento pelo link abaixo:',
    reviewUrl,
    '',
    'Obrigado!',
  ].join('\n');
}

export function createWorkOrderReviewWhatsAppUrl(phone: string, message: string): string {
  if (!isValidBrazilianPhone(phone)) {
    throw new Error('O telefone do cliente é inválido.');
  }

  const normalizedPhone = normalizeBrazilianPhone(phone);

  return `https://wa.me/55${normalizedPhone}` + `?text=${encodeURIComponent(message)}`;
}
