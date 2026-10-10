import type { z } from 'zod';

import type { ServiceResult } from '@/shared/types/serviceResult';

import type { currentLegalDocumentsResponseSchema } from '../schemas/legal.schema';

export type CurrentLegalDocuments = z.infer<typeof currentLegalDocumentsResponseSchema>;

export type CurrentLegalDocumentsResult = ServiceResult<{ documents: CurrentLegalDocuments }>;
