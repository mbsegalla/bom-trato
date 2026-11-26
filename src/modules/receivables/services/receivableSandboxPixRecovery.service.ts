import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { receivableSandboxPixRecoveryResponseSchema } from '../schemas/receivableSandboxPixRecovery.schema';
import type { ReceivableSandboxPixRecovery } from '../types/receivableSandboxPixRecovery.types';

async function request(
  organizationId: string,
  receivableId: string,
  issuanceId?: string,
): Promise<ReceivableSandboxPixRecovery> {
  const path = `/api/organizations/${encodeURIComponent(organizationId)}/receivables/${encodeURIComponent(receivableId)}/mercado-pago/sandbox-pix/recovery`;
  const response = await authenticatedFetch(
    path,
    issuanceId === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issuanceId }),
        },
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    switch (response.status) {
      case 403:
        throw new Error('Somente o proprietário autorizado pode consultar a cobrança de teste.');
      case 409:
        throw new Error('Consulta indisponível para esta cobrança. Atualize o status e confira a conexão.');
      default:
        throw new Error('Não foi possível consultar a revisão da cobrança de teste.');
    }
  }

  const parsed = receivableSandboxPixRecoveryResponseSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.organizationId !== organizationId || parsed.data.receivableId !== receivableId) {
    throw new Error('Não foi possível interpretar a revisão da cobrança.');
  }

  return parsed.data;
}

export function getReceivableSandboxPixRecovery(
  organizationId: string,
  receivableId: string,
): Promise<ReceivableSandboxPixRecovery> {
  return request(organizationId, receivableId);
}

export function recoverReceivableSandboxPix(
  organizationId: string,
  receivableId: string,
  issuanceId: string,
): Promise<ReceivableSandboxPixRecovery> {
  return request(organizationId, receivableId, issuanceId);
}
