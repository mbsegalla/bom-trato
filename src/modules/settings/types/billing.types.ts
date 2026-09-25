import type { z } from 'zod';

import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';

import type {
  billingCardSchema,
  billingEntitlementsSchema,
  billingInvoicePageSchema,
  billingInvoiceSchema,
  billingSubscriptionSchema,
  paymentMethodUpdateSchema,
  planChangeModeSchema,
  planChangeSchema,
  planChangeStatusSchema,
  subscriptionStatusSchema,
} from '../schemas/billing.schema';

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export type BillingSubscription = z.infer<typeof billingSubscriptionSchema>;

export type BillingEntitlements = z.infer<typeof billingEntitlementsSchema>;

export type BillingCard = z.infer<typeof billingCardSchema>;

export type BillingInvoice = z.infer<typeof billingInvoiceSchema>;

export type BillingInvoicePage = z.infer<typeof billingInvoicePageSchema>;

export type PaymentMethodUpdate = z.infer<typeof paymentMethodUpdateSchema>;

export type PlanChangeMode = z.infer<typeof planChangeModeSchema>;

export type PlanChangeStatus = z.infer<typeof planChangeStatusSchema>;

export type PlanChange = z.infer<typeof planChangeSchema>;

export interface BillingData {
  subscription: BillingSubscription | null;
  entitlements: BillingEntitlements;
  plans: Plan[];
  card: BillingCard | null;
  invoices: BillingInvoicePage;
  activePlanChange: PlanChange | null;
}

export interface CurrentPlan {
  plan: Plan;
  price: PlanPrice;
}
