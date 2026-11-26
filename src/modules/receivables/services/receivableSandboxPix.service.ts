import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { receivableSandboxPixResponseSchema } from '../schemas/receivableSandboxPix.schema';
import type { CreateReceivableSandboxPixInput, ReceivableSandboxPix } from '../types/receivableSandboxPix.types';

async function request(
  organizationId: string,
  receivableId: string,
  input?: CreateReceivableSandboxPixInput,
): Promise<ReceivableSandboxPix> {
  const path = `/api/organizations/${encodeURIComponent(organizationId)}/receivables/${encodeURIComponent(receivableId)}/mercado-pago/sandbox-pix`;
  const response = await authenticatedFetch(path, input === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }
  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new Error('Confira os dados de teste e a confirmação.');
      case 403:
        throw new Error('Somente o proprietário autorizado pode emitir o Pix de teste.');
      case 409:
        throw new Error('A cobrança ou a conexão foi alterada. Atualize o status antes de continuar.');
      default:
        throw new Error('Não foi possível confirmar o resultado. Consulte o status; não gere outra cobrança.');
    }
  }

  const parsed = receivableSandboxPixResponseSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.organizationId !== organizationId || parsed.data.receivableId !== receivableId) {
    throw new Error('Não foi possível interpretar a cobrança de teste.');
  }
  return parsed.data;
}

export function getReceivableSandboxPix(organizationId: string, receivableId: string): Promise<ReceivableSandboxPix> {
  return request(organizationId, receivableId);
}

export function issueReceivableSandboxPix(
  organizationId: string,
  receivableId: string,
  input: CreateReceivableSandboxPixInput,
): Promise<ReceivableSandboxPix> {
  return request(organizationId, receivableId, input);
}
