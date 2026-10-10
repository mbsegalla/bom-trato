import { getApiConfig } from '@/config/api.config';

import { publicLeadCreatedResponseSchema } from '../schemas/lead.schema';
import type { PublicLeadFormInput } from '../types/lead.types';

export async function createPublicLead(slug: string, requestKey: string, input: PublicLeadFormInput): Promise<void> {
  const { baseUrl } = getApiConfig();

  const { email, phone } = input;

  const response = await fetch(new URL(`/api/public/professionals/${encodeURIComponent(slug)}/leads`, baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...input,
      requestKey,
      email: email || null,
      phone: phone || null,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Este profissional não está disponível para novas solicitações.');
    }

    if (response.status === 503) {
      throw new Error('Estamos recebendo muitas solicitações. Tente novamente em instantes.');
    }

    throw new Error('Não foi possível enviar sua solicitação.');
  }

  const payload: unknown = await response.json();

  if (!publicLeadCreatedResponseSchema.safeParse(payload).success) {
    throw new Error('Não foi possível confirmar sua solicitação.');
  }
}
