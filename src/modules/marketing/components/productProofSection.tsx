import { CalendarDays, ClipboardCheck, FileCheck2, ReceiptText } from 'lucide-react';

const productProofs = [
  {
    icon: FileCheck2,
    eyebrow: 'Orçamento aprovado',
    title: 'A próxima etapa já pode nascer preparada.',
    description:
      'Cliente, endereço e serviços do orçamento podem seguir para a ordem de serviço sem você preencher tudo novamente.',
  },
  {
    icon: CalendarDays,
    eyebrow: 'Serviço em execução',
    title: 'Agenda e trabalho continuam no mesmo contexto.',
    description:
      'A ordem de serviço concentra responsável, endereço, agendamento e andamento para você acompanhar o que precisa acontecer.',
  },
  {
    icon: ReceiptText,
    eyebrow: 'Serviço concluído',
    title: 'O acompanhamento continua no financeiro.',
    description:
      'Ao concluir a ordem de serviço, o recebível correspondente é criado para que o valor não fique esquecido fora do fluxo.',
  },
  {
    icon: ClipboardCheck,
    eyebrow: 'Depois do atendimento',
    title: 'O relacionamento não termina na execução.',
    description:
      'Depois do serviço concluído, você pode convidar o cliente para avaliar o atendimento e fortalecer sua reputação.',
  },
];

export function ProductProofSection() {
  return (
    <section className="px-6 py-12 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div className="max-w-lg">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">O produto em ação</p>

            <h2 className="mt-4 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Menos tarefas repetidas.
              <span className="text-primary"> Mais continuidade.</span>
            </h2>

            <p className="mt-5 leading-relaxed text-muted-foreground">
              O Bom Trato não serve apenas para registrar informações. O contexto de uma etapa ajuda a preparar a
              próxima, enquanto você continua no controle das decisões do seu negócio.
            </p>
          </div>

          <div className="border-y border-border">
            {productProofs.map(({ icon: Icon, eyebrow, title, description }, index) => (
              <article
                key={title}
                className={
                  index === 0
                    ? 'grid gap-5 py-6 sm:grid-cols-[3rem_1fr]'
                    : 'grid gap-5 border-t border-border py-6 sm:grid-cols-[3rem_1fr]'
                }
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>

                  <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
