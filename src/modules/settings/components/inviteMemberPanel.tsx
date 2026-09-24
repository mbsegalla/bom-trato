'use client';

import { LoaderCircle, Mail, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { inviteMemberFormSchema } from '../schemas/team.schema';
import { inviteOrganizationMember } from '../services/team.service';

interface InviteMemberPanelProps {
  organizationId: string;
  onClose(): void;
  onSent(): void;
}

export function InviteMemberPanel({ organizationId, onClose, onSent }: InviteMemberPanelProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = inviteMemberFormSchema.safeParse({
      email: String(data.get('email') ?? ''),
    });

    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0] ?? 'Informe um e-mail válido.');

      return;
    }

    submittingRef.current = true;

    setSubmitting(true);
    setError(null);

    try {
      await inviteOrganizationMember(organizationId, parsed.data.email);

      onSent();
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar o convite.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Convidar membro</h2>

            <p className="mt-1 text-sm text-muted-foreground">Enviaremos um convite para o e-mail informado.</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <fieldset disabled={submitting} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="invite-member-email">E-mail *</Label>

                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    id="invite-member-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={254}
                    placeholder="pessoa@empresa.com"
                    className="h-12 rounded-xl pl-11"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  O convite é válido por 48 horas. A pessoa deverá acessar o link usando a mesma conta de e-mail que
                  recebeu o convite.
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
                className="cursor-pointer"
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting} className="cursor-pointer">
                {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                Enviar convite
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
