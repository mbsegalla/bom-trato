'use client';

import { Archive, ArrowLeft, LoaderCircle, Mail, MessageCircle, MessageSquare, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrazilianPhone } from '@/shared/formatters/phone.formatter';

import { archiveLead, convertLead, getLead, markLeadContacted } from '../services/lead.service';
import type { Lead } from '../types/lead.types';

function getWhatsappUrl(name: string, phone: string, requestedServiceName: string | null): string {
  const digits = phone.replace(/\D/g, '');

  const internationalPhone =
    digits.startsWith('55') && (digits.length === 12 || digits.length === 13) ? digits : `55${digits}`;

  const serviceMessage = requestedServiceName ? ` sobre ${requestedServiceName}` : '';

  const message = [
    `Olá, ${name}! Tudo bem?`,
    `Recebi sua solicitação de orçamento${serviceMessage} pelo Bom Trato.`,
    'Estou entrando em contato para entender melhor o que você precisa.',
  ].join(' ');

  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

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

      toast.success('Oportunidade marcada como contatada.');
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível atualizar a oportunidade.';

      setError(message);
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function convert(): Promise<void> {
    setLoadingAction('convert');
    setError(null);

    try {
      const result = await convertLead(organizationId, leadId);

      toast.success('Oportunidade convertida em cliente e orçamento.');

      router.push(`/quotes/${result.quoteId}`);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível converter a oportunidade.';

      setError(message);
      toast.error(message);
      setLoadingAction(null);
    }
  }

  async function archive(): Promise<void> {
    setLoadingAction('archive');
    setError(null);

    try {
      setLead(await archiveLead(organizationId, leadId));

      toast.success('Oportunidade arquivada.');
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível arquivar a oportunidade.';

      setError(message);
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  }

  if (!lead && !error) {
    return (
      <div className="mx-auto max-w-7xl py-12 text-center text-sm text-muted-foreground">
        Carregando oportunidade...
      </div>
    );
  }

  if (!lead) {
    return <div className="mx-auto max-w-7xl py-12 text-center text-sm text-destructive">{error}</div>;
  }

  const actionable = lead.status === 'NEW' || lead.status === 'CONTACTED';
  const whatsappUrl = lead.phone ? getWhatsappUrl(lead.name, lead.phone, lead.requestedServiceName) : null;

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/leads" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para oportunidades
      </Link>

      <header className="mt-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Oportunidade</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{lead.name}</h1>

            <p className="mt-2 text-muted-foreground">
              {lead.requestedServiceName ?? 'Solicitação recebida pela vitrine'}
            </p>
          </div>

          {actionable && (
            <Button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => void convert()}
              className="cursor-pointer"
            >
              {loadingAction === 'convert' && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              Converter em cliente e orçamento
            </Button>
          )}
        </div>

        {actionable && (
          <div className="mt-5 flex flex-wrap items-center gap-1 border-y border-border py-2">
            {lead.status === 'NEW' && (
              <Button
                type="button"
                variant="ghost"
                disabled={loadingAction !== null}
                onClick={() => void contacted()}
                className="cursor-pointer"
              >
                {loadingAction === 'contacted' ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <UserCheck aria-hidden="true" className="size-4" />
                )}
                Marcar como contatada
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              disabled={loadingAction !== null}
              onClick={() => void archive()}
              className="ml-auto cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Archive aria-hidden="true" className="size-4" />
              Arquivar
            </Button>
          </div>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-xl bg-muted/40 p-5 ring-1 ring-border/60">
          <h2 className="font-heading text-lg font-semibold">Contato</h2>

          <div className="mt-5 space-y-5">
            {lead.email && (
              <div className="flex items-start gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <a
                    href={`mailto:${lead.email}`}
                    className="mt-1 block truncate text-sm font-medium hover:text-primary"
                  >
                    {lead.email}
                  </a>
                </div>
              </div>
            )}

            {lead.phone && whatsappUrl && (
              <div className="flex items-start gap-3">
                <MessageCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm font-medium hover:text-primary"
                  >
                    {formatBrazilianPhone(lead.phone)}
                  </a>
                </div>
              </div>
            )}

            {!lead.email && !lead.phone && (
              <p className="text-sm text-muted-foreground">Nenhum contato foi informado nesta solicitação.</p>
            )}
          </div>
        </aside>

        <section>
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <MessageSquare aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Solicitação</h2>
          </div>

          <p className="mt-5 leading-relaxed whitespace-pre-line text-muted-foreground">{lead.message}</p>
        </section>
      </div>

      {lead.status === 'CONVERTED' && lead.convertedQuoteId && (
        <section className="mt-8 border-l-2 border-success bg-success-surface/60 px-4 py-3">
          <h2 className="font-semibold text-success">Oportunidade convertida</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            O cliente e o orçamento já foram criados a partir desta solicitação.
          </p>

          <Link
            href={`/quotes/${lead.convertedQuoteId}`}
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Abrir orçamento
          </Link>
        </section>
      )}
    </div>
  );
}
