import type { QuoteItem } from '../types/quote.types';

export type QuoteConfirmation =
  | {
      kind: 'APPROVE';
    }
  | {
      kind: 'DECLINE';
    }
  | {
      kind: 'CANCEL';
    }
  | {
      kind: 'REMOVE_ITEM';
      item: QuoteItem;
    };

export interface QuoteConfirmationContent {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
}

export function getQuoteConfirmationContent(confirmation: QuoteConfirmation | null): QuoteConfirmationContent | null {
  if (confirmation === null) {
    return null;
  }

  switch (confirmation.kind) {
    case 'REMOVE_ITEM':
      return {
        title: 'Remover item?',
        description: `${confirmation.item.name} será removido deste orçamento.`,
        confirmLabel: 'Remover item',
        destructive: true,
      };
    case 'APPROVE':
      return {
        title: 'Registrar aprovação?',
        description: 'Use esta opção quando o cliente tiver confirmado a aprovação por outro canal.',
        confirmLabel: 'Registrar aprovação',
        destructive: false,
      };
    case 'DECLINE':
      return {
        title: 'Registrar recusa?',
        description: 'O orçamento será marcado como recusado.',
        confirmLabel: 'Registrar recusa',
        destructive: true,
      };
    case 'CANCEL':
      return {
        title: 'Cancelar orçamento?',
        description: 'Esta ação encerra o orçamento atual.',
        confirmLabel: 'Cancelar orçamento',
        destructive: true,
      };
  }
}
