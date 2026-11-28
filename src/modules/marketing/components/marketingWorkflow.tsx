import { CalendarCheck2, ClipboardCheck, FileCheck2, ReceiptText } from 'lucide-react';

const workflow = [
  {
    icon: FileCheck2,
    title: 'O orçamento continua trabalhando depois de enviado',
    description:
      'O cliente pode aprovar, recusar ou solicitar uma alteração enquanto o Bom Trato acompanha propostas sem resposta.',
  },
  {
    icon: ClipboardCheck,
    title: 'A aprovação prepara o trabalho',
    description:
      'A ordem de serviço reaproveita cliente, endereço, serviços e condições financeiras sem reconstruir o atendimento.',
  },
  {
    icon: CalendarCheck2,
    title: 'Você organiza e executa o serviço',
    description:
      'Defina responsável e agendamento enquanto lembretes automáticos ajudam o cliente a não esquecer o atendimento.',
  },
  {
    icon: ReceiptText,
    title: 'O fluxo continua até receber e fidelizar',
    description:
      'Recebíveis, lembretes de pagamento e pedidos de avaliação mantêm o acompanhamento mesmo depois da execução.',
  },
];

export function MarketingWorkflow() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-brand text-brand-foreground">
        <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="px-6 py-10 sm:px-10 sm:py-14 lg:border-r lg:border-brand-foreground/15 lg:px-14">
            <ClipboardCheck aria-hidden="true" className="size-8 text-brand-muted" strokeWidth={1.5} />

            <p className="mt-7 text-xs font-semibold tracking-widest text-brand-muted uppercase">Um fluxo conectado</p>

            <h2 className="mt-4 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Da proposta ao pagamento, sem perder o contexto.
            </h2>

            <p className="mt-5 max-w-md leading-relaxed text-brand-muted">
              Cada etapa prepara a próxima para você avançar sem reconstruir informações ou depender da memória para
              saber quem precisa de retorno.
            </p>
          </div>

          <ol className="divide-y divide-brand-foreground/15 px-6 sm:px-10 lg:px-12">
            {workflow.map(({ icon: Icon, title, description }, index) => (
              <li key={title} className="grid gap-5 py-6 sm:grid-cols-[3rem_1fr] sm:items-start">
                <div className="flex items-center gap-3 sm:block">
                  <span className="text-xs font-medium text-brand-muted">{String(index + 1).padStart(2, '0')}</span>

                  <Icon aria-hidden="true" className="mt-2 size-5 text-brand-foreground sm:mt-3" strokeWidth={1.5} />
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
  );
}
