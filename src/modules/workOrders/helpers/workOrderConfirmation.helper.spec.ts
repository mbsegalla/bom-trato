import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getWorkOrderConfirmationContent } from './workOrderConfirmation.helper';

describe('work order lifecycle confirmation content', () => {
  it('does not display a confirmation when no action is pending', () => {
    assert.equal(getWorkOrderConfirmationContent(null), null);
  });

  it('explains the recorded start time before starting work', () => {
    assert.deepEqual(getWorkOrderConfirmationContent({ kind: 'START' }), {
      title: 'Iniciar o serviço?',
      description: 'A ordem será marcada como em andamento e o horário de início será registrado.',
      confirmLabel: 'Iniciar serviço',
    });
  });

  it('warns that completion prevents further editing before the user confirms', () => {
    const content = getWorkOrderConfirmationContent({ kind: 'COMPLETE' });

    assert.equal(content?.confirmLabel, 'Concluir serviço');
    assert.match(content?.description ?? '', /não poderá mais ser editada/);
  });
});
