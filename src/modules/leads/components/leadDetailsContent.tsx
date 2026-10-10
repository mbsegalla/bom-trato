'use client';

import { Archive, ArrowLeft, LoaderCircle, Mail, MessageSquare, Phone, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrazilianPhone } from '@/shared/formatters/phone.formatter';

import { archiveLead, convertLead, getLead, markLeadContacted } from '../services/lead.service';
import type { Lead } from '../types/lead.types';

export function LeadDetailsContent({ leadId }: { leadId: string }) {
  const { activeOrganization } = useApp();

  return (
    <OrganizationLeadDetails
      key={`${activeOrganization.id}:${leadId}`}
      organizationId={activeOrganization.id}
      leadId={leadId}
    />
  );
}

function OrganizationLeadDetails({ organizationId, leadId }: { organizationId: string; leadId: string }) {
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getLead(organizationId, leadId)
      .then((result) => {
        if (!active) return;

        setLead(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a oportunidade.');
      });

    return () => {
      active = false;
    };
  }, [leadId, organizationId, router]);

  async function contacted(): Promise<void> {
    setLoadingAction('contacted');
    setError(null);

    try {
      setLead(await markLeadContacted(organizationId, leadId));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a oportunidade.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function convert(): Promise<void> {
    setLoadingAction('convert');
    setError(null);

    try {
      const result = await convertLead(organizationId, leadId);

      router.push(`/quotes/${result.quoteId}`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível converter a oportunidade.');
      setLoadingAction(null);
    }
  }

  async function archive(): Promise<void> {
    setLoadingAction('archive');
    setError(null);

    try {
      setLead(await archiveLead(organizationId, leadId));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível arquivar a oportunidade.');
    } finally {
      setLoadingAction(null);
    }
  }

  if (!lead && !error) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-muted-foreground">
        Carregando oportunidade...
      </div>
    );
  }

  if (!lead) {
    return <div className="mx-auto max-w-5xl py-12 text-center text-sm text-destructive">{error}</div>;
  }

  const actionable = lead.status === 'NEW' || lead.status === 'CONTACTED';

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/leads" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" />
        Voltar para oportunidades
      </Link>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Oportunidade</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{lead.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {lead.requestedServiceName ?? 'Solicitação recebida pela vitrine'}
          </p>
        </div>

        {actionable && (
          <div className="flex flex-wrap gap-2">
            {lead.status === 'NEW' && (
              <Button
                type="button"
                variant="outline"
                disabled={loadingAction !== null}
                onClick={() => void contacted()}
                className="cursor-pointer"
              >
                {loadingAction === 'contacted' ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <UserCheck className="size-4" />
                )}
                Marcar como contatado
              </Button>
            )}

            <Button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => void convert()}
              className="cursor-pointer"
            >
              {loadingAction === 'convert' && <LoaderCircle className="size-4 animate-spin" />}
              Converter em cliente e orçamento
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={loadingAction !== null}
              onClick={() => void archive()}
              className="cursor-pointer"
            >
              <Archive className="size-4" />
              Arquivar
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Contato</h2>

          <div className="mt-5 space-y-4 text-sm">
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">
                  {lead.email}
                </a>
              </div>
            )}

            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <a href={`tel:+55${lead.phone}`} className="hover:text-primary hover:underline">
                  {formatBrazilianPhone(lead.phone)}
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <h2 className="font-semibold">Solicitação</h2>
          </div>

          <p className="mt-5 leading-relaxed whitespace-pre-line text-muted-foreground">{lead.message}</p>
        </section>
      </div>

      {lead.status === 'CONVERTED' && lead.convertedQuoteId && (
        <section className="mt-5 rounded-2xl border border-success/20 bg-success-surface p-6">
          <h2 className="font-semibold text-success">Oportunidade convertida</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            O cliente e o orçamento já foram criados a partir desta solicitação.
          </p>

          <Link
            href={`/quotes/${lead.convertedQuoteId}`}
            className="mt-4 inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            Abrir orçamento
          </Link>
        </section>
      )}
    </div>
  );
}
