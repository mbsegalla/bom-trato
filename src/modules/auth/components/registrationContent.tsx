import { CheckCircle2, Gift } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { getCurrentLegalDocuments } from '@/modules/legal/services/legal.service';
import { marketingTrial } from '@/modules/marketing/data/marketing.data';
import { listPlans } from '@/modules/plans/services/plan.service';

import { RegisterForm } from './registerForm';

interface RegistrationContentProps {
  searchParams: Promise<{ planPriceId?: string | string[] }>;
}

interface TrialRegistrationLayoutProps {
  children: ReactNode;
  selectedPlan?: boolean;
}

export async function RegistrationContent({ searchParams }: RegistrationContentProps) {
  const { planPriceId } = await searchParams;

  const legalResult = await getCurrentLegalDocuments();

  if (!legalResult.success) {
    return (
      <RegistrationUnavailable message="Não foi possível carregar os Termos de Uso. Tente novamente em instantes." />
    );
  }

  if (planPriceId === undefined) {
    return (
      <TrialRegistrationLayout>
        <RegisterForm legalDocuments={legalResult.documents} />
      </TrialRegistrationLayout>
    );
  }

  if (typeof planPriceId !== 'string' || !planPriceId) {
    return <RegistrationUnavailable message="A seleção de plano é inválida. Escolha um plano para continuar." />;
  }

  const result = await listPlans();

  if (!result.success) {
    return (
      <RegistrationUnavailable message="Não foi possível consultar o plano escolhido. Tente novamente em instantes." />
    );
  }

  for (const plan of result.plans) {
    const price = plan.prices.find((item) => item.id === planPriceId && item.intervalCount === 1);

    if (price) {
      return (
        <TrialRegistrationLayout selectedPlan>
          <RegisterForm
            selectedPlan={{
              name: plan.name,
              price,
            }}
            legalDocuments={legalResult.documents}
          />
        </TrialRegistrationLayout>
      );
    }
  }

  return (
    <RegistrationUnavailable message="Esse preço não está mais disponível. Escolha uma opção atualizada para continuar." />
  );
}

function TrialRegistrationLayout({ children, selectedPlan = false }: TrialRegistrationLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <section
        aria-label="Informações sobre a avaliação gratuita"
        className="mb-8 rounded-2xl border border-primary/15 bg-primary/5 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Gift aria-hidden="true" className="size-5" />
          </div>

          <div>
            <p className="text-base font-semibold text-primary">
              Seus primeiros {marketingTrial.durationDays} dias são grátis
            </p>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Experimente o Bom Trato na prática, sem compromisso financeiro.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
          {marketingTrial.benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-primary" />

              {benefit}
            </li>
          ))}
        </ul>

        {selectedPlan && (
          <p className="mt-4 border-t border-primary/15 pt-4 text-xs leading-relaxed text-muted-foreground">
            O plano escolhido é uma preferência para sua futura assinatura. A avaliação é individual e nenhuma
            contratação será realizada automaticamente.
          </p>
        )}
      </section>

      {children}
    </div>
  );
}

function RegistrationUnavailable({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Vamos conferir seu plano</h1>

      <p role="status" className="mt-4 leading-relaxed text-muted-foreground">
        {message}
      </p>

      <Link
        href={marketingTrial.href}
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Começar gratuitamente sem escolher plano
      </Link>

      <Link
        href="/#pricing"
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-input px-5 py-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Voltar aos planos
      </Link>
    </div>
  );
}
