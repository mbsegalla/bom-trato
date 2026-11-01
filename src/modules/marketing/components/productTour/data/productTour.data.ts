import {
  Banknote,
  CalendarDays,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Users,
  Wrench,
} from 'lucide-react';

export type ProductTourId =
  'overview' | 'leads' | 'customers' | 'services' | 'quotes' | 'work-orders' | 'schedule' | 'receivables';

export interface ProductTourItem {
  id: ProductTourId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const productTourItems: ProductTourItem[] = [
  {
    id: 'overview',
    label: 'Visão geral',
    eyebrow: 'Comece pelo que importa',
    title: 'Saiba o que está acontecendo no seu negócio.',
    description:
      'Veja recebimentos, serviços em andamento, próximos agendamentos e o que precisa da sua atenção sem procurar informação em várias telas.',
    icon: LayoutDashboard,
  },
  {
    id: 'leads',
    label: 'Oportunidades',
    eyebrow: 'Novos trabalhos',
    title: 'Acompanhe oportunidades antes de virarem clientes.',
    description: 'Registre contatos interessados, acompanhe a origem e mantenha visível quem ainda precisa de retorno.',
    icon: Inbox,
  },
  {
    id: 'customers',
    label: 'Clientes',
    eyebrow: 'Relacionamento organizado',
    title: 'Mantenha cada cliente e seu histórico no mesmo lugar.',
    description:
      'Nome, telefone, e-mail e informações do atendimento ficam disponíveis para continuar a relação sem depender de anotações soltas.',
    icon: Users,
  },
  {
    id: 'services',
    label: 'Catálogo de serviços',
    eyebrow: 'Seu catálogo',
    title: 'Cadastre o que você vende uma vez.',
    description:
      'Organize seus serviços e valores para reutilizá-los em propostas e atendimentos sem digitar as mesmas informações novamente.',
    icon: Wrench,
  },
  {
    id: 'quotes',
    label: 'Orçamentos',
    eyebrow: 'Da proposta à aprovação',
    title: 'Transforme a necessidade do cliente em uma proposta clara.',
    description:
      'Monte o orçamento, acompanhe o status e, quando ele for aprovado, leve o contexto para a próxima etapa do trabalho.',
    icon: FileText,
  },
  {
    id: 'work-orders',
    label: 'Ordens de serviço',
    eyebrow: 'Execução do trabalho',
    title: 'O orçamento aprovado vira trabalho organizado.',
    description: 'Cliente, serviços, responsável, endereço, valor e andamento continuam juntos durante a execução.',
    icon: ClipboardList,
  },
  {
    id: 'schedule',
    label: 'Agendamentos',
    eyebrow: 'Rotina visível',
    title: 'Veja quando cada serviço precisa acontecer.',
    description:
      'Acompanhe os atendimentos programados e organize a rotina do profissional ou da equipe em uma visão de agenda.',
    icon: CalendarDays,
  },
  {
    id: 'receivables',
    label: 'Recebíveis',
    eyebrow: 'Até o dinheiro entrar',
    title: 'O fluxo continua depois que o serviço termina.',
    description:
      'Acompanhe valores em aberto, pagamentos registrados, vencimentos e saldos sem separar o financeiro da execução.',
    icon: Banknote,
  },
];
