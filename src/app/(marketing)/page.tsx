import { ArrowRight, Check, ChevronDown, ClipboardList, FileText, Users, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';
import { MarketingLink } from '@/modules/marketing/components/marketingLink';
import { PricingSectionSkeleton } from '@/modules/marketing/components/pricingSectionSkeleton';
import { ProductPreview } from '@/modules/marketing/components/productPreview';
import { PublicPricingSection } from '@/modules/marketing/components/publicPricingSection';
import { marketingFaqs } from '@/modules/marketing/data/marketing.data';

export const metadata: Metadata = {
  title: 'Bom Trato | Gestão para quem presta serviços',
  description: 'Organize clientes, orçamentos, ordens de serviço e recebimentos em um só lugar com o Bom Trato.',
};

const features = [
  {
    icon: Users,
    title: 'Cada cliente tem uma história.',
    description: 'Mantenha contatos e informações organizados para continuar o atendimento de onde parou.',
  },
  {
    icon: FileText,
    title: 'Uma proposta. O próximo passo.',
    description: 'Organize os orçamentos e acompanhe a evolução do trabalho até a ordem de serviço.',
  },
  {
    icon: Wallet,
    title: 'Saiba o que entrou. E o que falta.',
    description: 'Registre pagamentos e acompanhe os recebimentos sem depender de anotações espalhadas.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Comece pelas pessoas.',
    description: 'Cadastre seus clientes e os serviços que você oferece.',
  },
  {
    number: '02',
    title: 'Transforme conversas em propostas.',
    description: 'Monte seus orçamentos e organize os próximos trabalhos.',
  },
  {
    number: '03',
    title: 'Acompanhe até o pagamento.',
    description: 'Gerencie a execução e mantenha os recebimentos em dia.',
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-60 rounded-lg bg-primary p-4 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Ir para o conteúdo
      </a>

      <MarketingHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="overflow-hidden px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 lg:px-10">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                Para quem vive de fazer bem feito
              </p>

              <h1 className="mt-7 font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-5xl xl:text-6xl">
                Seu serviço é bom.
                <span className="mt-2 block text-primary">Sua gestão também pode ser.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Menos informações espalhadas. Mais tempo para seus clientes. Organize seu negócio do primeiro contato ao
                pagamento.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <MarketingLink href="#pricing">
                  Conhecer os planos
                  <ArrowRight aria-hidden="true" className="size-4" />
                </MarketingLink>

                <MarketingLink href="#how-it-works" variant="outline">
                  Ver como funciona
                </MarketingLink>
              </div>

              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                Do primeiro contato ao próximo bom trato.
              </p>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-6 py-16 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
              <h2 className="max-w-lg font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                O trabalho já exige bastante.
                <span className="text-primary"> A gestão pode ser simples.</span>
              </h2>

              <p className="max-w-lg self-end leading-relaxed text-muted-foreground">
                Um lugar para reunir as informações que ajudam você a atender melhor, acompanhar os serviços e entender
                sua rotina.
              </p>
            </div>

            <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="border-t border-border pt-6">
                  <Icon aria-hidden="true" className="size-7 text-primary" strokeWidth={1.5} />

                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>

                  <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-brand px-6 py-12 text-brand-foreground sm:px-10 sm:py-16 lg:px-14">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <ClipboardList aria-hidden="true" className="size-8 text-brand-muted" strokeWidth={1.5} />

                <h2 className="mt-6 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                  Uma rotina mais leve começa com o próximo passo.
                </h2>

                <p className="mt-5 leading-relaxed text-brand-muted">
                  Organize o essencial e construa seu jeito de trabalhar.
                </p>
              </div>

              <ol className="divide-y divide-brand-foreground/15">
                {steps.map((step) => (
                  <li key={step.number} className="flex gap-5 py-7 first:pt-0 last:pb-0">
                    <span className="pt-1 text-sm font-medium text-brand-muted">{step.number}</span>

                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-brand-muted">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <Suspense fallback={<PricingSectionSkeleton />}>
          <PublicPricingSection />
        </Suspense>

        <section id="faq" className="scroll-mt-24 border-t border-border px-6 py-20 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase">Antes do próximo passo</p>

              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Ficou alguma dúvida?
              </h2>

              <p className="mt-4 leading-relaxed text-muted-foreground">
                Conheça um pouco mais sobre como o Bom Trato se encaixa na sua rotina.
              </p>
            </div>

            <div className="divide-y divide-border border-y border-border">
              {marketingFaqs.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 rounded-sm py-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                    {faq.question}

                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
                    />
                  </summary>

                  <p className="pr-8 pb-6 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-secondary px-7 py-12 text-secondary-foreground sm:px-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight">
                Seu próximo bom trato começa com organização.
              </h2>

              <p className="mt-4 text-sm leading-relaxed">Encontre o plano que acompanha o seu momento.</p>
            </div>

            <MarketingLink href="#pricing" className="shrink-0">
              Conhecer os planos
              <ArrowRight aria-hidden="true" className="size-4" />
            </MarketingLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
          <span className="text-xl font-bold tracking-tight">bom trato.</span>

          <p className="text-sm text-muted-foreground">Gestão para quem presta serviços.</p>

          <a
            href="#pricing"
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Conhecer os planos
          </a>
        </div>
      </footer>
    </div>
  );
}
