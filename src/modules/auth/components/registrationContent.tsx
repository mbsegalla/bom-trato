import Link from 'next/link';

import { listPlans } from '@/modules/plans/services/plan.service';

import { RegisterForm } from './registerForm';

interface RegistrationContentProps {
  searchParams: Promise<{ planPriceId?: string | string[] }>;
}

export async function RegistrationContent({ searchParams }: RegistrationContentProps) {
  const { planPriceId } = await searchParams;

  if (planPriceId === undefined) {
    return <RegisterForm />;
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
        <RegisterForm
          selectedPlan={{
            name: plan.name,
            price,
          }}
        />
      );
    }
  }

  return (
    <RegistrationUnavailable message="Esse preço não está mais disponível. Escolha uma opção atualizada para continuar." />
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
        href="/#pricing"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Voltar aos planos
      </Link>
    </div>
  );
}
