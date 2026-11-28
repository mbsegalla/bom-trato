import { ArrowRight, CalendarCheck2, Check, Users, Wallet } from 'lucide-react';

const pillars = [
  {
    icon: Users,
    title: 'Conquiste clientes',
    description: 'Do primeiro contato à aprovação da proposta.',
    features: ['Clientes e histórico', 'Orçamentos digitais', 'Vitrine profissional e avaliações'],
  },
  {
    icon: CalendarCheck2,
    title: 'Organize seu trabalho',
    description: 'Planeje e execute cada atendimento com mais organização.',
    features: ['Ordens de serviço e fotos', 'Agenda e recorrência', 'Catálogo de serviços', 'Gestão de equipes'],
  },
  {
    icon: Wallet,
    title: 'Cuide dos resultados',
    description: 'Tenha clareza sobre os recebimentos do seu negócio.',
    features: ['Controle de entradas e saldos', 'Recebimentos e vencimentos', 'Lembretes automáticos'],
  },
];

export function MarketingFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="marketing-features-title"
      className="scroll-mt-24 px-6 py-12 sm:py-16 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Gestão completa</p>

          <h2
            id="marketing-features-title"
            className="mt-4 font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Tudo o que seu negócio precisa.
          </h2>

          <p className="mt-4 leading-relaxed text-muted-foreground">
            Mais organização, produtividade e controle em cada etapa do atendimento.
          </p>
        </div>

        <div className="mt-10 grid gap-8 border-y border-border py-8 lg:grid-cols-3 lg:gap-0">
          {pillars.map(({ icon: Icon, title, description, features }) => (
            <article
              key={title}
              className="border-b border-border pb-8 last:border-b-0 last:pb-0 lg:border-r lg:border-b-0 lg:px-8 lg:pb-0 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>

              <p className="mt-2 leading-relaxed text-muted-foreground lg:min-h-12">{description}</p>

              <ul className="mt-5 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />

                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="#product-tour"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Conheça o Bom Trato por dentro
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
