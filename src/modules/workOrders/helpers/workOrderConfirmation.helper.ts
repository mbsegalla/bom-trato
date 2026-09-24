export type WorkOrderConfirmation =
  | {
      kind: 'START';
    }
  | {
      kind: 'COMPLETE';
    };

export interface WorkOrderConfirmationContent {
  title: string;
  description: string;
  confirmLabel: string;
}

export function getWorkOrderConfirmationContent(
  confirmation: WorkOrderConfirmation | null,
): WorkOrderConfirmationContent | null {
  if (confirmation === null) {
    return null;
  }

  switch (confirmation.kind) {
    case 'START':
      return {
        title: 'Iniciar o serviço?',
        description: 'A ordem será marcada como em andamento e o horário de início será registrado.',
        confirmLabel: 'Iniciar serviço',
      };

    case 'COMPLETE':
      return {
        title: 'Concluir o serviço?',
        description: 'A ordem será marcada como concluída e não poderá mais ser editada.',
        confirmLabel: 'Concluir serviço',
      };
  }
}
