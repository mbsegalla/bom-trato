import {
  ArrowRight,
  CalendarCheck2,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  ReceiptText,
  Users,
  Wallet,
} from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { JsonLd } from '@/components/jsonLd';
import { siteConfig } from '@/config/site.config';
import { MarketingFooter } from '@/modules/marketing/components/marketingFooter';
import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';
import { MarketingLink } from '@/modules/marketing/components/marketingLink';
import { PricingSectionSkeleton } from '@/modules/marketing/components/pricingSectionSkeleton';
import { ProductPreview } from '@/modules/marketing/components/productPreview';
import { ProductProofSection } from '@/modules/marketing/components/productProofSection';
import { PublicPricingSection } from '@/modules/marketing/components/publicPricingSection';
import { marketingFaqs } from '@/modules/marketing/data/marketing.data';
import { FeaturedProfessionalsSection } from '@/modules/publicProfiles/components/featuredProfessionalsSection';

export const metadata: Metadata = {
  title: {
    absolute: 'Bom Trato | Gestão para prestadores de serviços',
  },
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: '/',
    siteName: siteConfig.name,
    title: 'Bom Trato | Gestão para prestadores de serviços',
    description: siteConfig.description,
  },
};

const benefits = [
  {
    icon: Users,
    title: 'Tudo no contexto do cliente.',
    description:
      'Contatos, endereços, histórico e serviços deixam de ficar espalhados entre conversas, planilhas e anotações.',
  },
  {
    icon: ClipboardCheck,
    title: 'Menos trabalho duplicado.',
    description:
      'Informações que já existem podem seguir do orçamento para a execução, reduzindo redigitação entre as etapas.',
  },
  {
    icon: Wallet,
    title: 'Mais clareza até receber.',
    description:
      'O atendimento não termina quando o serviço acaba. Continue acompanhando o que foi concluído, recebido e ainda está em aberto.',
  },
];

const workflow = [
  {
    icon: FileCheck2,
    title: 'O cliente aprova o orçamento',
    description: 'A proposta deixa de ser apenas um documento enviado e passa a preparar a execução do serviço.',
  },
  {
    icon: ClipboardCheck,
    title: 'A ordem de serviço ganha contexto',
    description: 'Cliente, endereço e serviços podem continuar juntos, sem reconstruir o atendimento do zero.',
  },
  {
    icon: CalendarCheck2,
    title: 'Você organiza e executa o trabalho',
    description:
      'Defina responsável, agendamento e andamento da ordem de serviço conforme a rotina real da sua equipe.',
  },
  {
    icon: ReceiptText,
    title: 'O financeiro continua o fluxo',
    description: 'Ao concluir o serviço, o recebível mantém o acompanhamento até o pagamento ser registrado.',
  },
];

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url.toString(),
    description: siteConfig.description,
    inLanguage: siteConfig.language,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    url: siteConfig.url.toString(),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: siteConfig.description,
    inLanguage: siteConfig.language,
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-60 rounded-lg bg-primary p-4 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Ir para o conteúdo
      </a>

      <MarketingHeader />

      <JsonLd data={homeJsonLd} />

      <main id="main-content" tabIndex={-1}>
        <section className="overflow-hidden px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 lg:px-10">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
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
                Clientes, orçamentos, agenda, ordens de serviço e recebimentos conectados em um único fluxo. Menos
                retrabalho para você e mais continuidade em cada atendimento.
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

              <ul className="mt-7 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  Acesso pelo navegador
                </li>

                <li className="flex items-center gap-2">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  Para autônomos e equipes
                </li>

                <li className="flex items-center gap-2 sm:col-span-2">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  Do primeiro contato ao recebimento, sem perder o contexto
                </li>
              </ul>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-6 py-16 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-20">
              <h2 className="max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Menos informação espalhada.
                <span className="text-primary"> Mais continuidade no atendimento.</span>
              </h2>

              <p className="max-w-lg self-end leading-relaxed text-muted-foreground">
                O Bom Trato conecta as partes da rotina que normalmente ficam separadas para você saber onde cada
                atendimento está e qual é o próximo passo.
              </p>
            </div>

            <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {benefits.map(({ icon: Icon, title, description }) => (
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
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-brand text-brand-foreground">
            <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
              <div className="px-6 py-12 sm:px-10 sm:py-16 lg:border-r lg:border-brand-foreground/15 lg:px-14">
                <ClipboardCheck aria-hidden="true" className="size-8 text-brand-muted" strokeWidth={1.5} />

                <p className="mt-8 text-xs font-semibold tracking-widest text-brand-muted uppercase">
                  Um fluxo conectado
                </p>

                <h2 className="mt-4 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                  Do orçamento aprovado ao recebimento.
                </h2>

                <p className="mt-5 max-w-md leading-relaxed text-brand-muted">
                  Cada etapa mantém o contexto do atendimento para que você avance sem precisar reconstruir as mesmas
                  informações.
                </p>
              </div>

              <ol className="divide-y divide-brand-foreground/15 px-6 sm:px-10 lg:px-12">
                {workflow.map(({ icon: Icon, title, description }, index) => (
                  <li key={title} className="grid gap-5 py-7 sm:grid-cols-[3rem_1fr] sm:items-start">
                    <div className="flex items-center gap-3 sm:block">
                      <span className="text-xs font-medium text-brand-muted">{String(index + 1).padStart(2, '0')}</span>

                      <Icon
                        aria-hidden="true"
                        className="mt-2 size-5 text-brand-foreground sm:mt-3"
                        strokeWidth={1.5}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold">{title}</h3>

                      <p className="mt-2 leading-relaxed text-brand-muted">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <ProductProofSection />

        <Suspense fallback={null}>
          <FeaturedProfessionalsSection />
        </Suspense>

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
                Entenda como o Bom Trato se encaixa na rotina de quem presta serviços.
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
              <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Cuide do serviço.
                <span className="text-primary"> O Bom Trato cuida do fluxo.</span>
              </h2>

              <p className="mt-4 max-w-xl leading-relaxed">
                Clientes, propostas, agenda, execução e recebimentos trabalhando juntos para você ter menos retrabalho e
                mais clareza na rotina.
              </p>
            </div>

            <MarketingLink href="#pricing" className="shrink-0">
              Conhecer os planos
              <ArrowRight aria-hidden="true" className="size-4" />
            </MarketingLink>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
