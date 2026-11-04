import {
  Banknote,
  BellRing,
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
  | 'overview'
  | 'automations'
  | 'leads'
  | 'customers'
  | 'services'
  | 'quotes'
  | 'work-orders'
  | 'schedule'
  | 'receivables';

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
    id: 'automations',
    label: 'Automações',
    eyebrow: 'Piloto Automático',
    title: 'Seu negócio continua andando enquanto você trabalha.',
    description:
      'Ative acompanhamentos para orçamentos sem resposta, lembretes de serviços, avaliações e cobranças e acompanhe o histórico do que foi programado.',
    icon: BellRing,
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
      'Organize seus serviços, valores e duração estimada para reutilizá-los em propostas e atendimentos sem digitar as mesmas informações novamente.',
    icon: Wrench,
  },
  {
    id: 'quotes',
    label: 'Orçamentos',
    eyebrow: 'Da proposta à decisão',
    title: 'Transforme a necessidade do cliente em uma proposta clara.',
    description:
      'Monte o orçamento, compartilhe com o cliente e acompanhe aprovação, recusa ou solicitação de alteração antes de seguir para a execução.',
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
      'Acompanhe os atendimentos programados, organize a rotina do profissional ou da equipe e deixe lembretes ajudarem o cliente a não esquecer.',
    icon: CalendarDays,
  },
  {
    id: 'receivables',
    label: 'Recebíveis',
    eyebrow: 'Até o dinheiro entrar',
    title: 'O fluxo continua depois que o serviço termina.',
    description:
      'Acompanhe entrada, saldo, valores em aberto, pagamentos registrados e vencimentos sem separar o financeiro da execução.',
    icon: Banknote,
  },
];
