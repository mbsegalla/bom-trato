import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { receivableLivePixResponseSchema } from '../schemas/receivableLivePix.schema';
import type { CreateReceivableLivePixInput, ReceivableLivePix } from '../types/receivableLivePix.types';

async function request(
  organizationId: string,
  receivableId: string,
  input?: CreateReceivableLivePixInput | { issuanceId: string },
): Promise<ReceivableLivePix> {
  const path = `/api/organizations/${encodeURIComponent(organizationId)}/receivables/${encodeURIComponent(receivableId)}/mercado-pago/live-pix`;
  const target = input && 'issuanceId' in input ? path + '/recovery' : path;
  const response = await authenticatedFetch(
    target,
    input === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }
  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new Error('Confira os dados do pagador e a confirmação.');
      case 403:
        throw new Error('Somente o proprietário autorizado pode emitir ou consultar o Pix real.');
      case 409:
        throw new Error('A cobrança ou a conexão foi alterada. Atualize o status antes de continuar.');
      default:
        throw new Error('Não foi possível confirmar o resultado. Consulte o status; não gere outra cobrança.');
    }
  }

  const parsed = receivableLivePixResponseSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.organizationId !== organizationId || parsed.data.receivableId !== receivableId) {
    throw new Error('Não foi possível interpretar a cobrança real.');
  }
  return parsed.data;
}

export function getReceivableLivePix(organizationId: string, receivableId: string): Promise<ReceivableLivePix> {
  return request(organizationId, receivableId);
}

export function issueReceivableLivePix(
  organizationId: string,
  receivableId: string,
  input: CreateReceivableLivePixInput,
): Promise<ReceivableLivePix> {
  return request(organizationId, receivableId, input);
}

export function recoverReceivableLivePix(
  organizationId: string,
  receivableId: string,
  issuanceId: string,
): Promise<ReceivableLivePix> {
  return request(organizationId, receivableId, { issuanceId });
}
