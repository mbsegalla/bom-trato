'use client';

import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SessionError } from '@/modules/auth/services/session.service';
import { listQuotes } from '@/modules/quotes/services/quote.service';

interface GettingStartedCardProps {
  organizationId: string;
}

export function GettingStartedCard({ organizationId }: GettingStartedCardProps) {
  const [hasQuotes, setHasQuotes] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    void listQuotes(organizationId, { page: 1, limit: 1, status: 'ALL' })
      .then((result) => {
        if (active) setHasQuotes(result.items.length > 0);
      })
      .catch((cause: unknown) => {
        if (!active) return;

        // O guia não deve bloquear o dashboard em caso de falha na consulta.
        if (!(cause instanceof SessionError)) setHasQuotes(null);
      });

    return () => {
      active = false;
    };
  }, [organizationId]);

  if (hasQuotes !== false) return null;

  return (
    <section className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Comece pelo primeiro atendimento</p>

          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
            Seu primeiro orçamento em uma etapa.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Escolha ou cadastre um cliente, informe o serviço e o valor. O Bom Trato prepara o rascunho para você
            revisar e compartilhar com o cliente.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="size-4 text-primary" />
              Cliente
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="size-4 text-primary" />
              Serviço e valor
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="size-4 text-primary" />
              Revisão e compartilhamento
            </span>
          </div>
        </div>

        <Link
          href="/quotes?new=1"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileText aria-hidden="true" className="size-4" />
          Criar primeiro orçamento
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
