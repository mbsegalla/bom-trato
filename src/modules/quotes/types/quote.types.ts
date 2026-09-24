import type { z } from 'zod';

import type { ServiceUnit } from '@/modules/serviceCatalog/types/catalogService.types';

import type {
  catalogQuoteItemFormSchema,
  createQuoteFormSchema,
  customQuoteItemFormSchema,
  publicQuoteDecisionSchema,
  publicQuoteSchema,
  quoteItemSchema,
  quoteListStatusSchema,
  quoteSchema,
  quoteShareSchema,
  quotesResponseSchema,
  quoteStatusHistorySchema,
  quoteStatusSchema,
  quoteSummarySchema,
  updateQuoteFormSchema,
} from '../schemas/quote.schema';

export type QuoteStatus = z.infer<typeof quoteStatusSchema>;

export type QuoteListStatus = z.infer<typeof quoteListStatusSchema>;

export type QuoteItem = z.infer<typeof quoteItemSchema>;

export type Quote = z.infer<typeof quoteSchema>;

export type QuoteSummary = z.infer<typeof quoteSummarySchema>;

export type QuotePage = z.infer<typeof quotesResponseSchema>;

export type QuoteStatusHistory = z.infer<typeof quoteStatusHistorySchema>;

export type QuoteShare = z.infer<typeof quoteShareSchema>;

export type PublicQuote = z.infer<typeof publicQuoteSchema>;

export type PublicQuoteDecision = z.infer<typeof publicQuoteDecisionSchema>;

export type CreateQuoteInput = z.output<typeof createQuoteFormSchema>;

export type UpdateQuoteInput = z.output<typeof updateQuoteFormSchema>;

export type CatalogQuoteItemFormInput = z.output<typeof catalogQuoteItemFormSchema>;

export type CustomQuoteItemFormInput = z.output<typeof customQuoteItemFormSchema>;

export interface QuoteListParams {
  page: number;
  limit?: number;
  status: QuoteListStatus;
  customerId?: string;
}

export interface QuoteItemMutationInput {
  version: number;
  quantity: string;
  catalogServiceId?: string;
  custom?: {
    name: string;
    description: string | null;
    unit: ServiceUnit;
    unitAmountInCents: number;
  };
}

export interface QuotePdfFile {
  blob: Blob;
  filename: string;
}
