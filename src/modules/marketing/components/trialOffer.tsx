import { ArrowRight, Bot, Check, Gift, ShieldCheck } from 'lucide-react';

import { marketingTrial } from '../data/marketing.data';
import { MarketingLink } from './marketingLink';

const trialFeatures = [
  'Clientes, orçamentos e ordens de serviço',
  'Agenda e controle de recebimentos',
  'Vitrine profissional e avaliações',
  `Até ${marketingTrial.automationLimit} automações por e-mail`,
  'Acesso individual durante a avaliação',
];

export function TrialOffer() {
  return (
    <article className="relative isolate mt-10 overflow-hidden rounded-[2rem] bg-brand text-brand-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-44 -right-32 size-96 rounded-full border border-brand-foreground/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -bottom-40 size-96 rounded-full bg-brand-foreground/5"
      />

      <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-foreground/10 px-3 py-2 text-xs font-semibold">
            <Gift aria-hidden="true" className="size-4" />
            Comece sem compromisso
          </div>

          <h3 className="mt-5 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Conheça o Bom Trato por 14 dias.
          </h3>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">R$ 0</span>

            <span className="text-sm text-brand-muted">durante toda a avaliação</span>
          </div>

          <p className="mt-5 max-w-lg leading-relaxed text-brand-muted">
            Experimente a plataforma na sua rotina, conheça os recursos e descubra como o Bom Trato pode ajudar seu
            negócio antes de escolher uma assinatura.
          </p>

          <MarketingLink href={marketingTrial.href} variant="inverse" className="mt-7 min-h-14 w-full px-6 sm:w-auto">
            Começar gratuitamente
            <ArrowRight aria-hidden="true" className="size-4" />
          </MarketingLink>

          <div className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-brand-muted">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
            Sem cartão de crédito. Nenhuma cobrança automática ao final da avaliação.
          </div>
        </div>

        <div className="rounded-2xl border border-brand-foreground/15 bg-brand-foreground/5 p-5 sm:p-7">
          <p className="text-lg font-semibold">O que você pode experimentar</p>

          <ul className="mt-5 space-y-4">
            {trialFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-muted" />

                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-start gap-3 border-t border-brand-foreground/15 pt-5">
            <Bot aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-muted" />

            <div>
              <p className="text-sm font-medium">Conheça o Piloto Automático</p>

              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                Experimente lembretes de serviços, acompanhamento de orçamentos e outras automações disponíveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
