'use client';

import { ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';
import { formatDate } from '@/shared/formatters/date.formatter';

import { removeOrganizationMember } from '../services/team.service';

interface MemberListProps {
  organizationId: string;
  currentUserId: string;
  members: OrganizationMember[];
  owner: boolean;
  onChanged(): void;
}

export function MemberList({ organizationId, currentUserId, members, owner, onChanged }: MemberListProps) {
  const [removing, setRemoving] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(): Promise<void> {
    if (!removing || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await removeOrganizationMember(organizationId, removing.id);

      setRemoving(null);
      onChanged();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível remover o membro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border p-6">
        <h2 className="font-heading text-xl font-semibold">Membros</h2>

        <p className="mt-1 text-sm text-muted-foreground">Pessoas que atualmente têm acesso a este negócio.</p>
      </header>

      {error && (
        <p
          role="alert"
          className="m-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="divide-y divide-border">
        {members.map((member) => {
          const current = member.userId === currentUserId;
          const isOwner = member.role === 'OWNER';

          return (
            <div key={member.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary">
                  {isOwner ? (
                    <ShieldCheck aria-hidden="true" className="size-5" />
                  ) : (
                    <UserRound aria-hidden="true" className="size-5" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{member.user.name}</p>

                    {current && <span className="text-xs text-muted-foreground">Você</span>}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {isOwner ? 'Administrador' : 'Membro'}
                    {' · '}
                    desde {formatDate(member.createdAt)}
                  </p>
                </div>
              </div>

              {owner && !isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setRemoving(member);
                  }}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Remover
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {removing && (
        <ConfirmationDialog
          title="Remover membro?"
          description={`${removing.user.name} perderá o acesso a este negócio.`}
          confirmLabel="Remover membro"
          destructive
          loading={loading}
          onCancel={() => setRemoving(null)}
          onConfirm={() => void handleRemove()}
        />
      )}
    </section>
  );
}
