'use client';

import { Building2, CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { storeActiveOrganizationId } from '@/modules/organizations/services/activeOrganization.storage';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { organizationInvitationTokenSchema } from '../schemas/team.schema';
import {
  acceptOrganizationInvitation,
  previewOrganizationInvitation,
  TeamRequestError,
} from '../services/team.service';
import type { PreviewOrganizationInvitation } from '../types/team.types';

interface InvitationState {
  token: string;
  kind: 'preview' | 'authentication-required' | 'error';
  preview?: PreviewOrganizationInvitation;
  message?: string;
}

function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);

  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

function getLocationHash(): string {
  return window.location.hash;
}

function getServerLocationHash(): string {
  return '';
}

export function OrganizationInvitationAccept() {
  const hash = useSyncExternalStore(subscribeToLocation, getLocationHash, getServerLocationHash);

  const token = useMemo(() => {
    if (!hash) {
      return null;
    }

    const tokens = new URLSearchParams(hash.slice(1)).getAll('token');

    if (tokens.length !== 1) {
      return null;
    }

    const candidate = tokens[0];

    return organizationInvitationTokenSchema.safeParse(candidate).success ? candidate : null;
  }, [hash]);

  const router = useRouter();

  const [state, setState] = useState<InvitationState | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const currentState = state?.token === token ? state : null;

  const invalidLink = hash.length > 0 && token === null;

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    void previewOrganizationInvitation(token)
      .then((preview) => {
        if (!active) {
          return;
        }

        setState({
          token,
          kind: 'preview',
          preview,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          setState({
            token,
            kind: 'authentication-required',
          });

          return;
        }

        setState({
          token,
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível consultar o convite.',
        });
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleAccept(): Promise<void> {
    if (!token || currentState?.kind !== 'preview' || accepting) {
      return;
    }

    setAccepting(true);
    setAcceptError(null);

    try {
      const result = await acceptOrganizationInvitation(token);

      storeActiveOrganizationId(result.organizationId);

      router.push('/dashboard');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        setState({
          token,
          kind: 'authentication-required',
        });

        return;
      }

      setAcceptError(
        cause instanceof TeamRequestError || cause instanceof Error
          ? cause.message
          : 'Não foi possível aceitar o convite.',
      );
    } finally {
      setAccepting(false);
    }
  }

  if (!hash) {
    return (
      <InvitationError title="Convite não encontrado" message="Abra novamente o link que você recebeu por e-mail." />
    );
  }

  if (invalidLink) {
    return (
      <InvitationError
        title="Link inválido"
        message="Este link de convite não é válido. Solicite um novo convite ao administrador."
      />
    );
  }

  if (!currentState) {
    return (
      <section aria-busy="true" className="w-full">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LoaderCircle aria-hidden="true" className="size-7 animate-spin" />
        </div>

        <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">Consultando convite</h1>

        <p className="mt-3 text-muted-foreground">Aguarde enquanto verificamos os dados do negócio.</p>
      </section>
    );
  }

  if (currentState.kind === 'authentication-required') {
    return (
      <section className="w-full">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 aria-hidden="true" className="size-7" />
        </div>

        <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">Entre para aceitar o convite</h1>

        <p className="mt-3 leading-relaxed text-muted-foreground">
          O convite precisa ser aceito pela conta que usa o mesmo e-mail para o qual ele foi enviado.
        </p>

        <Link
          href="/login"
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Entrar
        </Link>

        <Link
          href="/register"
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-muted"
        >
          Criar conta
        </Link>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          Depois de entrar ou confirmar sua nova conta, abra novamente o link recebido por e-mail.
        </p>
      </section>
    );
  }

  if (currentState.kind === 'error' || !currentState.preview) {
    return (
      <InvitationError
        title="Não foi possível abrir o convite"
        message={currentState.message ?? 'Solicite um novo convite ao administrador.'}
      />
    );
  }

  const preview = currentState.preview;

  return (
    <section className="w-full">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-success-surface text-success">
        <CircleCheck aria-hidden="true" className="size-7" />
      </div>

      <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary uppercase">Convite para equipe</p>

      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
        Você foi convidado para {preview.organization.name}
      </h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">
        Ao aceitar, este negócio será adicionado à sua conta do Bom Trato.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex items-center gap-3">
          <Building2 aria-hidden="true" className="size-5 text-primary" />

          <div>
            <p className="font-medium">{preview.organization.name}</p>

            <p className="mt-1 text-xs text-muted-foreground">Convite válido até {formatDateTime(preview.expiresAt)}</p>
          </div>
        </div>
      </div>

      {acceptError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {acceptError}
        </p>
      )}

      <Button
        type="button"
        disabled={accepting}
        onClick={() => void handleAccept()}
        className="mt-7 min-h-12 w-full cursor-pointer rounded-xl"
      >
        {accepting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
        Aceitar convite
      </Button>

      <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
        O convite só pode ser aceito pela conta correspondente ao e-mail convidado.
      </p>
    </section>
  );
}

function InvitationError({ title, message }: { title: string; message: string }) {
  return (
    <section className="w-full">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <CircleAlert aria-hidden="true" className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">{title}</h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">{message}</p>

      <Link
        href="/login"
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Ir para o login
      </Link>
    </section>
  );
}
