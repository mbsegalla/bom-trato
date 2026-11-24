import { ArrowRight, CheckCircle2, Gift } from 'lucide-react';

import { marketingTrial } from '../data/marketing.data';
import { MarketingLink } from './marketingLink';

export function MarketingCallToAction() {
  return (
    <section aria-labelledby="marketing-cta-title" className="px-6 pb-12 sm:pb-16 lg:px-10">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-brand px-7 py-12 text-brand-foreground sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-56 -right-40 size-128 rounded-full border border-brand-foreground/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -left-32 size-96 rounded-full bg-brand-foreground/5"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-foreground/10">
            <Gift aria-hidden="true" className="size-7" />
          </div>

          <p className="mt-6 text-xs font-semibold tracking-widest text-brand-muted uppercase">
            Seu próximo bom trato começa aqui
          </p>

          <h2
            id="marketing-cta-title"
            className="mt-4 font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Você cuida do serviço. O Bom Trato cuida do fluxo.
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-brand-muted">
            Experimente uma nova forma de organizar seu negócio. São 14 dias para conhecer a plataforma, testar os
            recursos e decidir com tranquilidade.
          </p>

          <MarketingLink href={marketingTrial.href} variant="inverse" className="mt-8 min-h-14 px-7">
            {marketingTrial.actionLabel}

            <ArrowRight aria-hidden="true" className="size-4" />
          </MarketingLink>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-brand-muted sm:text-sm">
            {marketingTrial.benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />

                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
