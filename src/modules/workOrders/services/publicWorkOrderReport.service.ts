import { getApiConfig } from '@/config/api.config';

import { workOrderShareTokenSchema } from '../schemas/workOrderPortal.schema';

export async function downloadPublicWorkOrderReport(token: string): Promise<Blob> {
  if (!workOrderShareTokenSchema.safeParse(token).success) {
    throw new Error('O link de acompanhamento é inválido.');
  }

  const { baseUrl, timeoutMs } = getApiConfig();
  let response: Response;

  try {
    response = await fetch(new URL('/api/public/work-orders/report.pdf', baseUrl), {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error('Não foi possível baixar o relatório. Confira sua conexão e tente novamente.');
  }

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'Este link não está mais disponível. Solicite um novo ao profissional.'
        : 'Não foi possível baixar o relatório do atendimento.',
    );
  }

  if (!response.headers.get('Content-Type')?.includes('application/pdf')) {
    throw new Error('Não foi possível interpretar o documento recebido.');
  }

  return response.blob();
}
