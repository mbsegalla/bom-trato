import { CalendarCheck2, Check, FileCheck2, ReceiptText, Users } from 'lucide-react';

const automations = [
  {
    icon: FileCheck2,
    title: 'Orçamentos',
    description: 'Acompanhe automaticamente clientes que ainda não responderam à proposta.',
  },
  {
    icon: CalendarCheck2,
    title: 'Agendamentos',
    description: 'Lembre o cliente quando um serviço agendado estiver se aproximando.',
  },
  {
    icon: Users,
    title: 'Avaliações',
    description: 'Peça a avaliação do atendimento depois que o serviço for concluído.',
  },
  {
    icon: ReceiptText,
    title: 'Recebimentos',
    description: 'Avise sobre vencimentos próximos e valores que continuam em atraso.',
  },
];

export function MarketingAutomations() {
  return (
    <section id="automations" className="scroll-mt-24 px-6 py-12 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Piloto Automático</p>

            <h2 className="mt-4 max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Enquanto você trabalha,
              <span className="text-primary"> o Bom Trato acompanha.</span>
            </h2>

            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
              Ative somente o que fizer sentido para sua rotina. O sistema acompanha momentos importantes sem tirar de
              você o controle sobre o serviço.
            </p>

            <div className="mt-7 flex items-start gap-3 rounded-xl bg-secondary p-4 text-secondary-foreground">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />

              <p className="text-sm leading-relaxed">
                O histórico mostra o que foi programado e enviado para você continuar sabendo o que está acontecendo.
              </p>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {automations.map(({ icon: Icon, title, description }) => (
              <article key={title} className="border-t border-border pt-5">
                <Icon aria-hidden="true" className="size-6 text-primary" strokeWidth={1.5} />

                <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
