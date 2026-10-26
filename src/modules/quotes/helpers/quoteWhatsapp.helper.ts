import type { Quote } from '@/modules/quotes/types/quote.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { isValidBrazilianPhone, normalizeBrazilianPhone } from '@/shared/formatters/phone.formatter';

export function createQuoteWhatsAppMessage(quote: Quote, shareUrl: string): string {
  return [
    `Olá, ${quote.customerName}! 👋`,
    '',
    'Segue o orçamento solicitado:',
    '',
    `📋 ${quote.title}`,
    `💰 Valor: ${formatBrlCurrency(quote.totalInCents)}`,
    '',
    'Você pode visualizar, baixar o PDF e aprovar ou recusar o orçamento pelo link abaixo:',
    shareUrl,
    '',
    'Qualquer dúvida, estou à disposição.',
  ].join('\n');
}

export function createQuoteWhatsAppUrl(phone: string | null, message: string): string {
  const encodedMessage = encodeURIComponent(message);

  if (!phone || !isValidBrazilianPhone(phone)) {
    return `https://wa.me/?text=${encodedMessage}`;
  }

  const normalizedPhone = normalizeBrazilianPhone(phone);

  return `https://wa.me/55${normalizedPhone}?text=${encodedMessage}`;
}
