'use client';

import { LoaderCircle, Mail, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { resendOrganizationInvitation, revokeOrganizationInvitation } from '../services/team.service';
import type { OrganizationInvitation } from '../types/team.types';
import { InvitationStatusBadge } from './invitationStatusBadge';

interface InvitationListProps {
  organizationId: string;
  invitations: OrganizationInvitation[];
  onChanged(): void;
}

interface InvitationAction {
  kind: 'RESEND' | 'REVOKE';
  invitation: OrganizationInvitation;
}

export function InvitationList({ organizationId, invitations, onChanged }: InvitationListProps) {
  const [action, setAction] = useState<InvitationAction | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResend(invitation: OrganizationInvitation): Promise<void> {
    if (loadingId) {
      return;
    }

    setLoadingId(invitation.id);
    setError(null);
    setMessage(null);

    try {
      await resendOrganizationInvitation(organizationId, invitation.id);

      setMessage(`Novo convite enviado para ${invitation.email}.`);

      onChanged();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível reenviar o convite.');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRevoke(): Promise<void> {
    if (action?.kind !== 'REVOKE' || loadingId) {
      return;
    }

    const invitation = action.invitation;

    setLoadingId(invitation.id);
    setError(null);
    setMessage(null);

    try {
      await revokeOrganizationInvitation(organizationId, invitation.id);

      setAction(null);

      setMessage(`Convite de ${invitation.email} revogado.`);

      onChanged();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível revogar o convite.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border p-6">
        <h2 className="font-heading text-xl font-semibold">Convites</h2>

        <p className="mt-1 text-sm text-muted-foreground">Acompanhe quem foi convidado para fazer parte da equipe.</p>
      </header>

      {message && (
        <p role="status" className="m-5 rounded-xl bg-success-surface p-3 text-sm text-success">
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="m-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {invitations.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Mail aria-hidden="true" className="mx-auto size-7 text-muted-foreground" />

          <p className="mt-3 text-sm text-muted-foreground">Nenhum convite foi enviado ainda.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {invitations.map((invitation) => {
            const resendable = invitation.status === 'PENDING' || invitation.status === 'EXPIRED';
            const revocable = invitation.status === 'PENDING' || invitation.status === 'EXPIRED';

            const loading = loadingId === invitation.id;

            return (
              <div
                key={invitation.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="truncate font-medium">{invitation.email}</p>

                    <InvitationStatusBadge status={invitation.status} />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Enviado em {formatDateTime(invitation.lastSentAt)}
                  </p>

                  {(invitation.status === 'PENDING' || invitation.status === 'EXPIRED') && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expira em {formatDateTime(invitation.expiresAt)}
                    </p>
                  )}

                  {invitation.acceptedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Aceito em {formatDateTime(invitation.acceptedAt)}
                    </p>
                  )}
                </div>

                {(resendable || revocable) && (
                  <div className="flex flex-wrap gap-2">
                    {resendable && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => void handleResend(invitation)}
                        className="cursor-pointer"
                      >
                        {loading ? (
                          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw aria-hidden="true" className="size-4" />
                        )}
                        Reenviar
                      </Button>
                    )}

                    {revocable && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        onClick={() =>
                          setAction({
                            kind: 'REVOKE',
                            invitation,
                          })
                        }
                        className="cursor-pointer text-destructive hover:text-destructive"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        Revogar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {action?.kind === 'REVOKE' && (
        <ConfirmationDialog
          title="Revogar convite?"
          description={`O convite enviado para ${action.invitation.email} deixará de ser válido.`}
          confirmLabel="Revogar convite"
          destructive
          loading={loadingId === action.invitation.id}
          onCancel={() => setAction(null)}
          onConfirm={() => void handleRevoke()}
        />
      )}
    </section>
  );
}
