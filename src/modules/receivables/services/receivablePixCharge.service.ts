import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { receivablePixChargeResponseSchema } from '../schemas/receivablePixCharge.schema';
import type { ReceivablePixCharge } from '../types/receivablePixCharge.types';

export async function getReceivablePixCharge(
  organizationId: string,
  receivableId: string,
): Promise<ReceivablePixCharge> {
  const response = await authenticatedFetch(
    `/api/organizations/${encodeURIComponent(organizationId)}/receivables/${encodeURIComponent(receivableId)}/pix-charge`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    switch (response.status) {
      case 403:
        throw new Error('Somente o proprietário autorizado pode gerar instruções Pix.');

      case 409:
        throw new Error('Confira o saldo em aberto e a configuração da chave Pix antes de gerar novamente.');

      case 503:
        throw new Error('Os dados de recebimento estão indisponíveis. Tente novamente ou contate o suporte.');

      default:
        throw new Error('Não foi possível gerar as instruções Pix.');
    }
  }

  const payload: unknown = await response.json();
  const parsed = receivablePixChargeResponseSchema.safeParse(payload);

  if (
    !parsed.success ||
    parsed.data.organizationId !== organizationId ||
    parsed.data.receivableId !== receivableId
  ) {
    throw new Error('Não foi possível confirmar as instruções Pix.');
  }

  return parsed.data;
}
