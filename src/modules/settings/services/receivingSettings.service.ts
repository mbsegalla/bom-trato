import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { receivingSettingsResponseSchema } from '../schemas/receivingSettings.schema';
import type { ReceivingSettingsView, SaveReceivingSettingsInput } from '../types/receivingSettings.types';

function receivingSettingsPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/receiving-settings`;
}

async function readSettings(response: Response): Promise<ReceivingSettingsView> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (response.status === 409) {
    throw new SessionError('Os dados de recebimento foram alterados. Atualize antes de tentar novamente.', 409);
  }

  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new Error('Confira o formato da chave Pix, o nome, a cidade e a confirmação.');

      case 403:
        throw new Error('Somente o proprietário autorizado do negócio pode gerenciar estes dados.');

      case 503:
        throw new Error('Os dados de recebimento estão indisponíveis. Tente novamente ou contate o suporte.');

      default:
        throw new Error('Não foi possível consultar ou salvar os dados de recebimento.');
    }
  }

  const payload: unknown = await response.json();
  const parsed = receivingSettingsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados de recebimento.');
  }

  return parsed.data;
}

export async function getReceivingSettings(organizationId: string): Promise<ReceivingSettingsView> {
  const response = await authenticatedFetch(receivingSettingsPath(organizationId));

  return readSettings(response);
}

export async function saveReceivingSettings(
  organizationId: string,
  input: SaveReceivingSettingsInput,
): Promise<ReceivingSettingsView> {
  const response = await authenticatedFetch(receivingSettingsPath(organizationId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return readSettings(response);
}
