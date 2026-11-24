import { ArrowRight, CheckCircle2, Gift } from 'lucide-react';

import { marketingTrial } from '../data/marketing.data';
import { MarketingLink } from './marketingLink';
import { ProductPreview } from './productPreview';

export function MarketingHero() {
  return (
    <section
      aria-labelledby="marketing-hero-title"
      className="overflow-hidden px-6 pt-12 pb-12 sm:pt-16 sm:pb-16 lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary sm:text-sm">
            <Gift aria-hidden="true" className="size-4 shrink-0" />
            {marketingTrial.durationDays} dias grátis para começar
          </div>

          <h1
            id="marketing-hero-title"
            className="mt-6 font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-5xl xl:text-6xl"
          >
            Seu serviço é bom.
            <span className="mt-2 block text-primary">Sua gestão também pode ser.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Organize clientes, orçamentos, agenda, serviços e recebimentos em um só lugar. Enquanto você trabalha, o Bom
            Trato cuida das tarefas repetitivas por você.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <MarketingLink href={marketingTrial.href} className="min-h-14 px-6">
              {marketingTrial.actionLabel}

              <ArrowRight aria-hidden="true" className="size-4" />
            </MarketingLink>

            <MarketingLink href="#product-tour" variant="outline" className="min-h-14 px-6">
              Conhecer o produto
            </MarketingLink>
          </div>

          <ul className="mt-6 grid gap-x-5 gap-y-3 text-sm text-muted-foreground sm:grid-cols-2">
            {marketingTrial.benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-primary" />

                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-7 border-t border-border pt-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Feito para autônomos e empresas de serviços. Acesse pelo computador ou celular, sem precisar instalar
              nada.
            </p>
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
