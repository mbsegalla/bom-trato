import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { workOrderWarrantyFormSchema, workOrderWarrantyResponseSchema } from '../schemas/workOrderDocument.schema';
import type {
  WorkOrderReportFile,
  WorkOrderWarrantyInput,
  WorkOrderWarrantyResult,
} from '../types/workOrderDocument.types';

function pathFor(organizationId: string, workOrderId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/${encodeURIComponent(workOrderId)}`;
}

async function assertSuccess(response: Response): Promise<void> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (response.ok) {
    return;
  }

  if (response.status === 409) {
    throw new Error('As condições foram alteradas ou estão bloqueadas após o aceite. Atualize os dados.');
  }

  if (response.status === 403) {
    throw new Error('Você não possui permissão para realizar esta operação.');
  }

  if (response.status === 404) {
    throw new Error('Ordem de serviço não encontrada.');
  }

  throw new Error('Não foi possível concluir a operação. Tente novamente.');
}

async function readWarranty(response: Response): Promise<WorkOrderWarrantyResult> {
  await assertSuccess(response);

  const payload: unknown = await response.json().catch(() => null);
  const parsed = workOrderWarrantyResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar as condições de garantia.');
  }

  return parsed.data;
}

export async function getWorkOrderWarranty(
  organizationId: string,
  workOrderId: string,
): Promise<WorkOrderWarrantyResult> {
  const response = await authenticatedFetch(`${pathFor(organizationId, workOrderId)}/warranty`);
  return readWarranty(response);
}

export async function updateWorkOrderWarranty(
  organizationId: string,
  workOrderId: string,
  version: number,
  input: WorkOrderWarrantyInput,
): Promise<WorkOrderWarrantyResult> {
  const parsed = workOrderWarrantyFormSchema.parse(input);
  const response = await authenticatedFetch(`${pathFor(organizationId, workOrderId)}/warranty`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...parsed, version }),
  });
  return readWarranty(response);
}

export async function downloadWorkOrderReport(
  organizationId: string,
  workOrderId: string,
): Promise<WorkOrderReportFile> {
  const response = await authenticatedFetch(`${pathFor(organizationId, workOrderId)}/report.pdf`);
  await assertSuccess(response);

  if (!response.headers.get('Content-Type')?.includes('application/pdf')) {
    throw new Error('Não foi possível interpretar o relatório.');
  }

  return { blob: await response.blob(), filename: `relatorio-os-${workOrderId}.pdf` };
}
