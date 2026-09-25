'use client';

import { CircleAlert, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { listOrganizationMembers } from '@/modules/organizations/services/organization.service';
import { formatUserUsage, hasUnlimitedUsers } from '@/shared/formatters/userLimit.formatter';

import { getTeamEntitlements, listOrganizationInvitations } from '../services/team.service';
import type { TeamData } from '../types/team.types';
import { InvitationList } from './invitationList';
import { InviteMemberPanel } from './inviteMemberPanel';
import { MemberList } from './memberList';
import { TeamSettingsSkeleton } from './teamSettingsSkeleton';

interface TeamState {
  requestKey: string;
  data: TeamData;
}

interface TeamErrorState {
  requestKey: string;
  message: string;
}

export function TeamSettings() {
  const { user, activeOrganization } = useApp();

  return (
    <OrganizationTeamSettings
      key={activeOrganization.id}
      organizationId={activeOrganization.id}
      owner={activeOrganization.role === 'OWNER'}
      currentUserId={user.id}
    />
  );
}

function OrganizationTeamSettings({
  organizationId,
  owner,
  currentUserId,
}: {
  organizationId: string;
  owner: boolean;
  currentUserId: string;
}) {
  const router = useRouter();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<TeamState | null>(null);
  const [errorState, setErrorState] = useState<TeamErrorState | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const requestKey = `${organizationId}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    const invitationsRequest = owner ? listOrganizationInvitations(organizationId) : Promise.resolve([]);

    void Promise.all([listOrganizationMembers(organizationId), invitationsRequest, getTeamEntitlements(organizationId)])
      .then(([members, invitations, entitlements]) => {
        if (!active) {
          return;
        }

        setErrorState(null);

        setState({
          requestKey,
          data: {
            members,
            invitations,
            entitlements,
          },
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar a equipe.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, owner, refreshVersion, requestKey, router]);

  const data = state?.data ?? null;

  const error = errorState?.requestKey === requestKey ? errorState.message : null;

  const refreshing = state !== null && state.requestKey !== requestKey;

  function refresh(): void {
    setRefreshVersion((value) => value + 1);
  }

  if (!data && !error) {
    return <TeamSettingsSkeleton />;
  }

  if (!data && error) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <CircleAlert aria-hidden="true" className="mx-auto size-7 text-destructive" />

        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>

        <Button type="button" variant="outline" onClick={refresh} className="mt-5 cursor-pointer">
          Tentar novamente
        </Button>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const { members, invitations, entitlements } = data;

  const usagePercentage =
    entitlements.maxUsers > 0 ? Math.min(100, (entitlements.memberCount / entitlements.maxUsers) * 100) : 0;

  let restrictionMessage: string | null = null;

  if (owner && !entitlements.hasAccess) {
    restrictionMessage = 'É necessária uma assinatura ativa para adicionar membros.';
  } else if (owner && !entitlements.teamManagementEnabled) {
    restrictionMessage = 'Seu plano atual não inclui gerenciamento de equipe.';
  } else if (owner && entitlements.maxUsers > 0 && entitlements.memberCount >= entitlements.maxUsers) {
    restrictionMessage = 'O limite de usuários do seu plano foi atingido.';
  }

  return (
    <div
      aria-busy={refreshing}
      className={refreshing ? 'space-y-5 opacity-70 transition-opacity' : 'space-y-5 transition-opacity'}
    >
      {feedback && (
        <p role="status" className="rounded-xl bg-success-surface p-4 text-sm text-success">
          {feedback}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
                <Users aria-hidden="true" className="size-5" />
              </div>

              <div>
                <h2 className="font-heading text-xl font-semibold">Equipe</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {formatUserUsage(entitlements.memberCount, entitlements.maxUsers)}
                </p>
              </div>
            </div>
          </div>

          {owner && (
            <Button
              type="button"
              disabled={!entitlements.canAddMember}
              onClick={() => {
                setFeedback(null);
                setInviteOpen(true);
              }}
              className="cursor-pointer"
            >
              <Plus aria-hidden="true" className="size-4" />
              Convidar membro
            </Button>
          )}
        </div>

        {entitlements.maxUsers > 0 && !hasUnlimitedUsers(entitlements.maxUsers) && (
          <div className="mt-6">
            <div
              role="progressbar"
              aria-label="Utilização de usuários do plano"
              aria-valuemin={0}
              aria-valuemax={entitlements.maxUsers}
              aria-valuenow={entitlements.memberCount}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{
                  width: `${usagePercentage}%`,
                }}
              />
            </div>
          </div>
        )}

        {restrictionMessage && (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-warning-surface p-4 text-sm text-warning">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

            <p>{restrictionMessage}</p>
          </div>
        )}

        {!owner && (
          <p className="mt-5 text-sm text-muted-foreground">
            Somente o administrador do negócio pode convidar ou remover membros.
          </p>
        )}
      </section>

      <MemberList
        organizationId={organizationId}
        currentUserId={currentUserId}
        members={members}
        owner={owner}
        onChanged={refresh}
      />

      {owner && <InvitationList organizationId={organizationId} invitations={invitations} onChanged={refresh} />}

      {inviteOpen && (
        <InviteMemberPanel
          organizationId={organizationId}
          onClose={() => setInviteOpen(false)}
          onSent={() => {
            setFeedback('Convite enviado. A pessoa receberá um e-mail com as próximas etapas.');
            refresh();
          }}
        />
      )}
    </div>
  );
}
