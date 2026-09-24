import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  acceptOrganizationInvitationResponseSchema,
  apiErrorResponseSchema,
  organizationInvitationsResponseSchema,
  previewOrganizationInvitationResponseSchema,
  sendInvitationResponseSchema,
  teamEntitlementsResponseSchema,
} from '../schemas/team.schema';
import type {
  AcceptOrganizationInvitationResult,
  OrganizationInvitation,
  PreviewOrganizationInvitation,
  SendInvitationResult,
  TeamEntitlements,
} from '../types/team.types';

const PAGE_LIMIT = 100;

const invitationFlights = new Map<string, Promise<OrganizationInvitation[]>>();

const entitlementFlights = new Map<string, Promise<TeamEntitlements>>();

export class TeamRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
  ) {
    super(message);

    this.name = 'TeamRequestError';
  }
}

function organizationPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}`;
}

function getTeamErrorMessage(code: string | null, status: number, fallback: string): string {
  switch (code) {
    case 'OWNER_REQUIRED':
      return 'Somente o administrador do negócio pode realizar esta ação.';

    case 'VERIFIED_USER_REQUIRED':
      return 'Confirme seu e-mail antes de gerenciar a equipe.';

    case 'ALREADY_MEMBER':
      return 'Esse usuário já faz parte da equipe.';

    case 'SUBSCRIPTION_REQUIRED':
      return 'É necessária uma assinatura ativa para gerenciar a equipe.';

    case 'TEAM_MANAGEMENT_REQUIRED':
      return 'Seu plano atual não inclui gerenciamento de equipe.';

    case 'MEMBER_LIMIT_REACHED':
      return 'O limite de usuários do seu plano foi atingido.';

    case 'INVITATION_ALREADY_PENDING':
      return 'Já existe um convite pendente para esse e-mail.';

    case 'INVITATION_NOT_FOUND':
      return 'O convite não foi encontrado.';

    case 'INVITATION_EXPIRED':
      return 'Este convite expirou. Solicite um novo convite.';

    case 'INVITATION_CLOSED':
      return 'Este convite não está mais disponível.';

    case 'INVITATION_EMAIL_MISMATCH':
      return 'Este convite foi enviado para outra conta.';

    case 'INVITATION_RATE_LIMITED':
      return 'Aguarde um momento antes de reenviar outro convite.';

    case 'MEMBER_NOT_FOUND':
      return 'O membro não foi encontrado.';

    case 'OWNER_REMOVAL_FORBIDDEN':
      return 'O administrador do negócio não pode ser removido.';

    case 'BILLING_RECONCILIATION_REQUIRED':
    case 'TEAM_BUSY':
      return 'A equipe está sendo atualizada. Tente novamente em instantes.';
  }

  if (status === 403) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (status === 404) {
    return 'O recurso solicitado não foi encontrado.';
  }

  if (status === 429) {
    return 'Muitas solicitações. Aguarde antes de tentar novamente.';
  }

  return fallback;
}

async function throwTeamRequestError(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  const payload: unknown = await response.json().catch(() => null);

  const parsed = apiErrorResponseSchema.safeParse(payload);

  const code = parsed.success ? parsed.data.error.code : null;

  throw new TeamRequestError(getTeamErrorMessage(code, response.status, fallback), response.status, code);
}

async function requestOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
  const invitations: OrganizationInvitation[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await authenticatedFetch(
      `${organizationPath(organizationId)}/invitations?page=${page}&limit=${PAGE_LIMIT}`,
    );

    if (!response.ok) {
      await throwTeamRequestError(response, 'Não foi possível carregar os convites.');
    }

    const payload: unknown = await response.json();

    const parsed = organizationInvitationsResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new Error('Não foi possível interpretar os convites.');
    }

    invitations.push(...parsed.data.items);

    page += 1;
    hasMore = parsed.data.hasMore;
  }

  return invitations;
}

export function listOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
  const existing = invitationFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestOrganizationInvitations(organizationId);

  invitationFlights.set(organizationId, request);

  const cleanup = () => {
    if (invitationFlights.get(organizationId) === request) {
      invitationFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestTeamEntitlements(organizationId: string): Promise<TeamEntitlements> {
  const response = await authenticatedFetch(`${organizationPath(organizationId)}/billing/entitlements`);

  if (!response.ok) {
    await throwTeamRequestError(response, 'Não foi possível carregar os limites da equipe.');
  }

  const payload: unknown = await response.json();

  const parsed = teamEntitlementsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os limites da equipe.');
  }

  return parsed.data;
}

export function getTeamEntitlements(organizationId: string): Promise<TeamEntitlements> {
  const existing = entitlementFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestTeamEntitlements(organizationId);

  entitlementFlights.set(organizationId, request);

  const cleanup = () => {
    if (entitlementFlights.get(organizationId) === request) {
      entitlementFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function inviteOrganizationMember(organizationId: string, email: string): Promise<SendInvitationResult> {
  const response = await authenticatedFetch(`${organizationPath(organizationId)}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });

  if (!response.ok) {
    await throwTeamRequestError(response, 'Não foi possível enviar o convite.');
  }

  const payload: unknown = await response.json();

  const parsed = sendInvitationResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o convite enviado.');
  }

  return parsed.data;
}

export async function resendOrganizationInvitation(
  organizationId: string,
  invitationId: string,
): Promise<SendInvitationResult> {
  const response = await authenticatedFetch(
    `${organizationPath(organizationId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    await throwTeamRequestError(response, 'Não foi possível reenviar o convite.');
  }

  const payload: unknown = await response.json();

  const parsed = sendInvitationResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o convite reenviado.');
  }

  return parsed.data;
}

export async function revokeOrganizationInvitation(organizationId: string, invitationId: string): Promise<void> {
  const response = await authenticatedFetch(
    `${organizationPath(organizationId)}/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    await throwTeamRequestError(response, 'Não foi possível revogar o convite.');
  }
}

export async function removeOrganizationMember(organizationId: string, memberId: string): Promise<void> {
  const response = await authenticatedFetch(
    `${organizationPath(organizationId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    await throwTeamRequestError(response, 'Não foi possível remover o membro.');
  }
}

export async function previewOrganizationInvitation(token: string): Promise<PreviewOrganizationInvitation> {
  const response = await authenticatedFetch('/api/organization-invitations/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
    }),
  });

  if (!response.ok) {
    await throwTeamRequestError(response, 'Não foi possível consultar o convite.');
  }

  const payload: unknown = await response.json();

  const parsed = previewOrganizationInvitationResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o convite.');
  }

  return parsed.data;
}

export async function acceptOrganizationInvitation(token: string): Promise<AcceptOrganizationInvitationResult> {
  const response = await authenticatedFetch('/api/organization-invitations/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
    }),
  });

  if (!response.ok) {
    await throwTeamRequestError(response, 'Não foi possível aceitar o convite.');
  }

  const payload: unknown = await response.json();

  const parsed = acceptOrganizationInvitationResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a confirmação do convite.');
  }

  return parsed.data;
}
