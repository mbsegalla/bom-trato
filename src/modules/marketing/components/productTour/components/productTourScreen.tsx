import { AlertTriangle, CalendarDays, CheckCircle2, Mail, Phone, ReceiptText } from 'lucide-react';

import type { ProductTourId } from '../data/productTour.data';

interface ProductTourScreenProps {
  activeId: ProductTourId;
}

interface ScreenHeaderProps {
  title: string;
  description: string;
}

function ScreenHeader({ title, description }: ScreenHeaderProps) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground sm:text-xs">Marco Serviços</p>

      <h3 className="mt-1 font-heading text-base font-semibold tracking-tight sm:text-lg">{title}</h3>

      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground sm:text-xs">{description}</p>
    </div>
  );
}

function OverviewScreen() {
  return (
    <>
      <ScreenHeader title="Visão geral" description="Acompanhe o trabalho e os próximos passos." />

      <div className="mt-5 grid grid-cols-3 border-y border-border">
        <div className="py-3 pr-2">
          <p className="text-[9px] leading-tight text-muted-foreground sm:text-xs">Recebido no mês</p>
          <p className="mt-1 text-sm font-semibold text-primary sm:text-lg">R$ 3.450</p>
        </div>

        <div className="border-l border-border px-2 py-3 sm:px-3">
          <p className="text-[9px] leading-tight text-muted-foreground sm:text-xs">A receber</p>
          <p className="mt-1 text-sm font-semibold text-primary sm:text-lg">R$ 1.200</p>
        </div>

        <div className="border-l border-border py-3 pl-2 sm:pl-3">
          <p className="text-[9px] leading-tight text-muted-foreground sm:text-xs">Em andamento</p>
          <p className="mt-1 text-sm font-semibold sm:text-lg">2</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <CalendarDays aria-hidden="true" className="size-4 text-primary" />
            <p className="text-xs font-semibold">Próximos agendamentos</p>
          </div>

          <div className="grid grid-cols-[3rem_1fr] gap-3 py-3">
            <div>
              <p className="text-xs font-semibold">09:00</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Amanhã</p>
            </div>

            <div>
              <p className="text-xs font-medium">Instalação elétrica</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Cliente Almeida</p>
            </div>
          </div>

          <div className="grid grid-cols-[3rem_1fr] gap-3 border-t border-border py-3">
            <div>
              <p className="text-xs font-semibold">14:30</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Amanhã</p>
            </div>

            <div>
              <p className="text-xs font-medium">Manutenção preventiva</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Comercial Silva</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <AlertTriangle aria-hidden="true" className="size-4 text-warning" />
            <p className="text-xs font-semibold">Precisa da sua atenção</p>
          </div>

          <div className="py-3">
            <p className="text-xs font-medium">2 orçamentos aguardando resposta</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Acompanhe o retorno dos clientes.</p>
          </div>

          <div className="border-t border-border py-3">
            <p className="text-xs font-medium">1 recebível em aberto</p>
            <p className="mt-1 text-[10px] text-muted-foreground">R$ 1.200,00 pendente.</p>
          </div>
        </section>
      </div>
    </>
  );
}

function LeadsScreen() {
  const items = [
    {
      name: 'Ana Martins',
      source: 'Vitrine profissional',
      interest: 'Instalação elétrica',
      status: 'Novo',
    },
    {
      name: 'Paulo Ribeiro',
      source: 'Indicação',
      interest: 'Manutenção preventiva',
      status: 'Em contato',
    },
    {
      name: 'Comercial Horizonte',
      source: 'WhatsApp',
      interest: 'Revisão elétrica',
      status: 'Qualificado',
    },
  ];

  return (
    <>
      <ScreenHeader
        title="Oportunidades"
        description="Organize os contatos que ainda podem se transformar em novos trabalhos."
      />

      <div className="mt-5 grid grid-cols-3 border-y border-border">
        <div className="py-3 pr-2">
          <p className="text-[10px] text-muted-foreground">Novas</p>
          <p className="mt-1 text-lg font-semibold">3</p>
        </div>

        <div className="border-l border-border px-3 py-3">
          <p className="text-[10px] text-muted-foreground">Em contato</p>
          <p className="mt-1 text-lg font-semibold">2</p>
        </div>

        <div className="border-l border-border py-3 pl-3">
          <p className="text-[10px] text-muted-foreground">Qualificadas</p>
          <p className="mt-1 text-lg font-semibold text-primary">1</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.1fr_1fr_1.2fr_auto] gap-3 bg-muted/30 px-4 py-2.5 text-[10px] font-medium text-muted-foreground">
          <span>Contato</span>
          <span>Origem</span>
          <span>Interesse</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-[1.1fr_1fr_1.2fr_auto] gap-3 px-4 py-3 text-[10px] sm:text-xs"
            >
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">{item.source}</span>
              <span className="text-muted-foreground">{item.interest}</span>
              <span className="whitespace-nowrap text-primary">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CustomersScreen() {
  const customers = [
    {
      name: 'Maria Almeida',
      email: 'maria@exemplo.com',
      phone: '(34) 99999-1234',
    },
    {
      name: 'Comercial Silva',
      email: 'contato@comercialsilva.com',
      phone: '(34) 98888-4321',
    },
    {
      name: 'Carlos Mendes',
      email: 'carlos@exemplo.com',
      phone: '(34) 97777-8765',
    },
  ];

  return (
    <>
      <ScreenHeader title="Clientes" description="Contatos e informações organizados para cada atendimento." />

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_1.4fr_auto] gap-4 bg-muted/30 px-4 py-2.5 text-[10px] font-medium text-muted-foreground">
          <span>Cliente</span>
          <span>Contato</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border">
          {customers.map((customer) => (
            <div key={customer.name} className="grid grid-cols-[1fr_1.4fr_auto] gap-4 px-4 py-3">
              <div>
                <p className="text-xs font-medium">{customer.name}</p>
              </div>

              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Mail aria-hidden="true" className="size-3" />
                  {customer.email}
                </p>

                <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Phone aria-hidden="true" className="size-3" />
                  {customer.phone}
                </p>
              </div>

              <span className="self-start rounded-full bg-success-surface px-2 py-1 text-[10px] font-medium text-success">
                Ativo
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ServicesScreen() {
  const services = [
    {
      name: 'Instalação elétrica',
      description: 'Instalação e adequação de pontos elétricos.',
      price: 'R$ 350,00',
    },
    {
      name: 'Manutenção preventiva',
      description: 'Revisão preventiva da instalação.',
      price: 'R$ 280,00',
    },
    {
      name: 'Troca de quadro',
      description: 'Substituição e organização do quadro elétrico.',
      price: 'R$ 780,00',
    },
  ];

  return (
    <>
      <ScreenHeader
        title="Catálogo de serviços"
        description="Cadastre seus serviços para reutilizá-los no restante da operação."
      />

      <div className="mt-5 divide-y divide-border border-y border-border">
        {services.map((service) => (
          <div key={service.name} className="flex items-start justify-between gap-5 py-4">
            <div>
              <p className="text-xs font-medium">{service.name}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{service.description}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold">{service.price}</p>
              <p className="mt-1 text-[10px] text-success">Ativo</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function QuotesScreen() {
  const quotes = [
    {
      title: 'Instalação elétrica',
      customer: 'Maria Almeida',
      status: 'Aprovado',
      value: 'R$ 1.200,00',
      className: 'bg-success-surface text-success',
    },
    {
      title: 'Manutenção preventiva',
      customer: 'Comercial Silva',
      status: 'Enviado',
      value: 'R$ 780,00',
      className: 'bg-info-surface text-info',
    },
    {
      title: 'Troca de quadro',
      customer: 'Carlos Mendes',
      status: 'Rascunho',
      value: 'R$ 950,00',
      className: 'bg-muted text-muted-foreground',
    },
  ];

  return (
    <>
      <ScreenHeader title="Orçamentos" description="Crie propostas e acompanhe a decisão do cliente." />

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.3fr_1fr_auto_auto] gap-3 bg-muted/30 px-4 py-2.5 text-[10px] font-medium text-muted-foreground">
          <span>Orçamento</span>
          <span>Cliente</span>
          <span>Status</span>
          <span>Valor</span>
        </div>

        <div className="divide-y divide-border">
          {quotes.map((quote) => (
            <div
              key={quote.title}
              className="grid grid-cols-[1.3fr_1fr_auto_auto] items-center gap-3 px-4 py-3 text-[10px] sm:text-xs"
            >
              <span className="font-medium">{quote.title}</span>
              <span className="text-muted-foreground">{quote.customer}</span>

              <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${quote.className}`}>
                {quote.status}
              </span>

              <span className="font-medium">{quote.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-success-surface px-4 py-3 text-success">
        <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />

        <div>
          <p className="text-xs font-semibold">Orçamento aprovado</p>
          <p className="mt-0.5 text-[10px]">A ordem de serviço pode continuar com o mesmo contexto.</p>
        </div>
      </div>
    </>
  );
}

function WorkOrdersScreen() {
  const orders = [
    {
      title: 'Instalação elétrica',
      customer: 'Maria Almeida',
      responsible: 'Marco',
      status: 'Agendada',
      value: 'R$ 1.200,00',
    },
    {
      title: 'Manutenção preventiva',
      customer: 'Comercial Silva',
      responsible: 'Rafael',
      status: 'Em andamento',
      value: 'R$ 780,00',
    },
    {
      title: 'Troca de quadro',
      customer: 'Carlos Mendes',
      responsible: 'Marco',
      status: 'Concluída',
      value: 'R$ 950,00',
    },
  ];

  return (
    <>
      <ScreenHeader
        title="Ordens de serviço"
        description="Planeje, acompanhe e conclua o trabalho com o contexto do atendimento."
      />

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.25fr_1fr_0.8fr_auto] gap-3 bg-muted/30 px-4 py-2.5 text-[10px] font-medium text-muted-foreground">
          <span>Serviço</span>
          <span>Cliente</span>
          <span>Responsável</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border">
          {orders.map((order) => (
            <div
              key={order.title}
              className="grid grid-cols-[1.25fr_1fr_0.8fr_auto] items-center gap-3 px-4 py-3 text-[10px] sm:text-xs"
            >
              <div>
                <p className="font-medium">{order.title}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{order.value}</p>
              </div>

              <span className="text-muted-foreground">{order.customer}</span>
              <span className="text-muted-foreground">{order.responsible}</span>

              <span className="whitespace-nowrap text-primary">{order.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ScheduleScreen() {
  const schedule = [
    {
      time: '09:00',
      title: 'Instalação elétrica',
      customer: 'Maria Almeida',
      responsible: 'Marco',
    },
    {
      time: '11:30',
      title: 'Revisão elétrica',
      customer: 'Ana Martins',
      responsible: 'Rafael',
    },
    {
      time: '14:30',
      title: 'Manutenção preventiva',
      customer: 'Comercial Silva',
      responsible: 'Marco',
    },
  ];

  return (
    <>
      <ScreenHeader title="Agendamentos" description="Visualize os serviços programados e a rotina da equipe." />

      <div className="mt-5 flex items-center justify-between border-y border-border py-3">
        <div>
          <p className="text-xs font-semibold">Novembro de 2026</p>
          <p className="mt-1 text-[10px] text-muted-foreground">3 serviços programados para hoje</p>
        </div>

        <span className="rounded-lg border border-border px-2.5 py-1.5 text-[10px]">Hoje</span>
      </div>

      <div className="mt-4 divide-y divide-border rounded-xl border border-border px-4">
        {schedule.map((item) => (
          <div key={`${item.time}-${item.title}`} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 py-3">
            <p className="text-xs font-semibold">{item.time}</p>

            <div>
              <p className="text-xs font-medium">{item.title}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{item.customer}</p>
            </div>

            <span className="text-[10px] text-muted-foreground">{item.responsible}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function ReceivablesScreen() {
  const receivables = [
    {
      title: 'Instalação elétrica',
      customer: 'Maria Almeida',
      status: 'Em aberto',
      amount: 'R$ 1.200,00',
      received: 'R$ 0,00',
      balance: 'R$ 1.200,00',
    },
    {
      title: 'Manutenção preventiva',
      customer: 'Comercial Silva',
      status: 'Parcial',
      amount: 'R$ 780,00',
      received: 'R$ 400,00',
      balance: 'R$ 380,00',
    },
    {
      title: 'Troca de quadro',
      customer: 'Carlos Mendes',
      status: 'Pago',
      amount: 'R$ 950,00',
      received: 'R$ 950,00',
      balance: 'R$ 0,00',
    },
  ];

  return (
    <>
      <ScreenHeader title="Recebíveis" description="Acompanhe o que entrou e o que ainda falta receber." />

      <div className="mt-5 grid grid-cols-3 border-y border-border">
        <div className="py-3 pr-2">
          <p className="text-[10px] text-muted-foreground">Total a receber</p>
          <p className="mt-1 text-sm font-semibold text-primary">R$ 1.580</p>
        </div>

        <div className="border-l border-border px-3 py-3">
          <p className="text-[10px] text-muted-foreground">Recebido</p>
          <p className="mt-1 text-sm font-semibold">R$ 1.350</p>
        </div>

        <div className="border-l border-border py-3 pl-3">
          <p className="text-[10px] text-muted-foreground">Pendentes</p>
          <p className="mt-1 text-sm font-semibold">2</p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-border">
        {receivables.map((receivable) => (
          <div key={receivable.title} className="grid grid-cols-[1.3fr_auto] gap-4 py-3">
            <div>
              <p className="text-xs font-medium">{receivable.title}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {receivable.customer} · {receivable.status}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-primary">{receivable.balance}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {receivable.received} de {receivable.amount}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground">
        <ReceiptText aria-hidden="true" className="size-3.5 text-primary" />O serviço concluído continua até o pagamento
        ser registrado.
      </div>
    </>
  );
}

export function ProductTourScreen({ activeId }: ProductTourScreenProps) {
  switch (activeId) {
    case 'leads':
      return <LeadsScreen />;
    case 'customers':
      return <CustomersScreen />;
    case 'services':
      return <ServicesScreen />;
    case 'quotes':
      return <QuotesScreen />;
    case 'work-orders':
      return <WorkOrdersScreen />;
    case 'schedule':
      return <ScheduleScreen />;
    case 'receivables':
      return <ReceivablesScreen />;
    case 'overview':
    default:
      return <OverviewScreen />;
  }
}
