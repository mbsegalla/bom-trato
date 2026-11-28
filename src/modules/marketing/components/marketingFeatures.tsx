import { CalendarCheck2, ClipboardCheck, FileCheck2, ReceiptText, Users, Wallet } from 'lucide-react';

const benefits = [
  {
    icon: Users,
    title: 'Clientes e histórico',
    description: 'Centralize contatos, endereços e histórico de atendimentos para continuar cada serviço de onde parou.',
  },
  {
    icon: FileCheck2,
    title: 'Orçamentos digitais',
    description: 'Compartilhe propostas e acompanhe aprovações, recusas e solicitações de alteração.',
  },
  {
    icon: ClipboardCheck,
    title: 'Ordens de serviço',
    description: 'Organize a execução, responsáveis e registros fotográficos dos atendimentos.',
  },
  {
    icon: CalendarCheck2,
    title: 'Agenda e recorrência',
    description: 'Planeje compromissos e atendimentos periódicos sem reconstruir toda a rotina.',
  },
  {
    icon: Wallet,
    title: 'Controle financeiro',
    description: 'Acompanhe entradas, saldos, vencimentos e pagamentos recebidos em um só lugar.',
  },
  {
    icon: ReceiptText,
    title: 'Vitrine e reputação',
    description: 'Divulgue seu perfil profissional e reúna avaliações vinculadas aos serviços realizados.',
  },
];

export function MarketingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 px-6 py-12 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-20">
          <h2 className="max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Tudo para organizar seu negócio.
            <span className="text-primary"> Do orçamento ao recebimento.</span>
          </h2>

          <p className="max-w-lg self-end leading-relaxed text-muted-foreground">
            Conecte sua rotina comercial, operacional e financeira em uma plataforma feita para quem presta serviços.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6">
              <Icon aria-hidden="true" className="size-7 text-primary" strokeWidth={1.5} />

              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>

              <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
