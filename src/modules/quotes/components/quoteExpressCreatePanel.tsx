'use client';

import { ArrowRight, FileText, LoaderCircle, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { InlineOptionsSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SessionError } from '@/modules/auth/services/session.service';
import { customerFormSchema } from '@/modules/customers/schemas/customer.schema';
import { createCustomer, listCustomers } from '@/modules/customers/services/customer.service';
import type { CustomerPage } from '@/modules/customers/types/customer.types';
import {
  getQuotePaymentConditionDescription,
  quotePaymentConditionOptions,
} from '@/modules/quotes/constants/quote.constants';
import { createQuoteFormSchema, customQuoteItemFormSchema } from '@/modules/quotes/schemas/quote.schema';
import { addQuoteItem, createQuote } from '@/modules/quotes/services/quote.service';
import type { Quote, QuotePaymentCondition } from '@/modules/quotes/types/quote.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTimeLocalInput } from '@/shared/formatters/date.formatter';
import { formatBrazilianPhoneInput } from '@/shared/formatters/phone.formatter';
import { parseBrlCurrencyToCents } from '@/shared/parses/currency.parser';
import { parseQuantity } from '@/shared/parses/quantity.parser';

type CustomerMode = 'EXISTING' | 'NEW';

type ExpressField =
  | 'customerId'
  | 'customerName'
  | 'customerPhone'
  | 'customerEmail'
  | 'title'
  | 'validUntil'
  | 'paymentCondition'
  | 'downPaymentPercentage'
  | 'name'
  | 'quantity'
  | 'unitAmountInCents';

type FieldErrors = Partial<Record<ExpressField, string>>;

interface QuoteExpressCreatePanelProps {
  organizationId: string;
  onClose(): void;
  onCreated(quote: Quote): void;
  onStandard(): void;
}

interface CustomerState {
  requestKey: string;
  data: CustomerPage;
}

const VALIDATION_CUSTOMER_ID = '00000000-0000-4000-8000-000000000000';

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function QuoteExpressCreatePanel({
  organizationId,
  onClose,
  onCreated,
  onStandard,
}: QuoteExpressCreatePanelProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const createdCustomerIdRef = useRef<string | null>(null);

  const [customerMode, setCustomerMode] = useState<CustomerMode>('EXISTING');
  const [customerSearchDraft, setCustomerSearchDraft] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentCondition, setPaymentCondition] = useState<QuotePaymentCondition>('AFTER_COMPLETION');
  const [downPaymentPercentage, setDownPaymentPercentage] = useState('30');
  const [quantity, setQuantity] = useState('1');
  const [unitAmount, setUnitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [defaultValidity] = useState(() => formatDateTimeLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));

  const requestKey = `${organizationId}:${customerSearch}`;
  const amountInCents = parseBrlCurrencyToCents(unitAmount);
  const parsedQuantity = parseQuantity(quantity);
  const totalInCents =
    amountInCents !== null && parsedQuantity !== null ? Math.round(amountInCents * Number(parsedQuantity)) : null;

  useEffect(() => {
    if (customerMode !== 'EXISTING') return;

    let active = true;

    void listCustomers(organizationId, {
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      search: customerSearch,
    })
      .then((result) => {
        if (!active) return;

        setCustomerError(null);
        setCustomerState({ requestKey, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setCustomerError(cause instanceof Error ? cause.message : 'Não foi possível carregar seus clientes.');
      });

    return () => {
      active = false;
    };
  }, [customerMode, customerSearch, organizationId, requestKey, router]);

  const customers = customerState?.requestKey === requestKey ? customerState.data.items : null;

  function handleCustomerModeChange(mode: CustomerMode): void {
    setCustomerMode(mode);
    setError(null);
    setFieldErrors({});
  }

  function handleCustomerSearch(): void {
    setCustomerId('');
    setCustomerSearch(customerSearchDraft.trim());
  }

  function handlePhoneChange(value: string): void {
    setCustomerPhone(formatBrazilianPhoneInput(value));
    setFieldErrors((current) => ({ ...current, customerPhone: undefined }));
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    const data = new FormData(event.currentTarget);
    const customer =
      customerMode === 'NEW'
        ? customerFormSchema.safeParse({
            name: String(data.get('customerName') ?? ''),
            phone: customerPhone,
            email: String(data.get('customerEmail') ?? ''),
            defaultServiceAddress: '',
            notes: '',
          })
        : null;

    const quote = createQuoteFormSchema.safeParse({
      customerId: customerMode === 'NEW' ? VALIDATION_CUSTOMER_ID : customerId,
      title: String(data.get('title') ?? ''),
      notes: String(data.get('notes') ?? ''),
      validUntil: String(data.get('validUntil') ?? ''),
      paymentCondition,
      downPaymentPercentage: paymentCondition === 'DOWN_PAYMENT_AND_BALANCE' ? downPaymentPercentage : '',
    });

    const item = customQuoteItemFormSchema.safeParse({
      name: String(data.get('name') ?? ''),
      description: String(data.get('description') ?? ''),
      unit: 'SERVICE',
      quantity,
      unitAmountInCents: unitAmount,
    });

    if ((customer && !customer.success) || !quote.success || !item.success) {
      const customerErrors = customer && !customer.success ? customer.error.flatten().fieldErrors : null;
      const quoteErrors = !quote.success ? quote.error.flatten().fieldErrors : null;
      const itemErrors = !item.success ? item.error.flatten().fieldErrors : null;

      setFieldErrors({
        customerId: firstError(quoteErrors?.customerId),
        customerName: firstError(customerErrors?.name),
        customerPhone: firstError(customerErrors?.phone),
        customerEmail: firstError(customerErrors?.email),
        title: firstError(quoteErrors?.title),
        validUntil: firstError(quoteErrors?.validUntil),
        paymentCondition: firstError(quoteErrors?.paymentCondition),
        downPaymentPercentage: firstError(quoteErrors?.downPaymentPercentage),
        name: firstError(itemErrors?.name),
        quantity: firstError(itemErrors?.quantity),
        unitAmountInCents: firstError(itemErrors?.unitAmountInCents),
      });

      setError('Confira os campos indicados antes de continuar.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    let createdQuote: Quote | null = null;

    try {
      let resolvedCustomerId = customerId;

      if (customerMode === 'NEW') {
        if (!customer?.success) return;

        if (createdCustomerIdRef.current === null) {
          const saved = await createCustomer(organizationId, customer.data);
          createdCustomerIdRef.current = saved.id;
        }

        resolvedCustomerId = createdCustomerIdRef.current;
      }

      createdQuote = await createQuote(organizationId, { ...quote.data, customerId: resolvedCustomerId });

      const completedQuote = await addQuoteItem(organizationId, createdQuote.id, {
        version: createdQuote.version,
        quantity: item.data.quantity,
        custom: {
          name: item.data.name,
          description: item.data.description,
          unit: item.data.unit,
          unitAmountInCents: item.data.unitAmountInCents,
        },
      });

      toast.success('Orçamento criado com o serviço incluído.');
      onCreated(completedQuote);
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      const message = cause instanceof Error ? cause.message : 'Não foi possível criar o orçamento.';

      if (createdQuote !== null) {
        toast.error('O orçamento foi salvo como rascunho. Confira o item antes de compartilhar.');
        onCreated(createdQuote);
        return;
      }

      setError(message);
      toast.error(message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="express-quote-title"
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-background shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border border-b px-6 py-5">
          <div>
            <h2 id="express-quote-title" className="font-heading text-2xl font-semibold">
              Orçamento expresso
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">Cliente, serviço e valor em uma única etapa.</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <fieldset disabled={submitting} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading text-lg font-semibold">1. Cliente</h3>

                  <div className="flex gap-1 rounded-xl bg-muted p-1">
                    <Button
                      type="button"
                      variant={customerMode === 'EXISTING' ? 'default' : 'ghost'}
                      onClick={() => handleCustomerModeChange('EXISTING')}
                      className="cursor-pointer"
                    >
                      Existente
                    </Button>

                    <Button
                      type="button"
                      variant={customerMode === 'NEW' ? 'default' : 'ghost'}
                      onClick={() => handleCustomerModeChange('NEW')}
                      className="cursor-pointer"
                    >
                      Novo
                    </Button>
                  </div>
                </div>

                {customerMode === 'EXISTING' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="express-customer-search">Buscar cliente</Label>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                          />

                          <Input
                            id="express-customer-search"
                            type="search"
                            value={customerSearchDraft}
                            onChange={(event) => setCustomerSearchDraft(event.currentTarget.value)}
                            placeholder="Nome, e-mail ou telefone"
                            className="h-11 rounded-xl pl-10"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCustomerSearch}
                          className="cursor-pointer"
                        >
                          Buscar
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cliente *</Label>

                      {customerError && (
                        <p role="alert" className="text-sm text-destructive">
                          {customerError}
                        </p>
                      )}

                      {!customers ? (
                        <InlineOptionsSkeleton />
                      ) : customers.length === 0 ? (
                        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                          Nenhum cliente encontrado. Você pode cadastrar um agora.
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => handleCustomerModeChange('NEW')}
                            className="mt-2 cursor-pointer px-0"
                          >
                            Cadastrar cliente
                          </Button>
                        </div>
                      ) : (
                        <Select
                          items={customers.map((customer) => ({
                            value: customer.id,
                            label: customer.name,
                          }))}
                          value={customerId || null}
                          onValueChange={(value) => setCustomerId(value ?? '')}
                        >
                          <SelectTrigger aria-label="Cliente" className="h-12 rounded-xl">
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>

                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {customerState?.requestKey === requestKey && customerState.data.hasMore && (
                        <p className="text-xs text-muted-foreground">Refine a busca para encontrar outros clientes.</p>
                      )}

                      {fieldErrors.customerId && (
                        <p role="alert" className="text-sm text-destructive">
                          {fieldErrors.customerId}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="express-customer-name">Nome *</Label>

                      <Input
                        id="express-customer-name"
                        name="customerName"
                        maxLength={100}
                        placeholder="Nome do cliente"
                        className="h-12 rounded-xl"
                      />

                      {fieldErrors.customerName && (
                        <p role="alert" className="text-sm text-destructive">
                          {fieldErrors.customerName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="express-customer-phone">Telefone *</Label>

                      <Input
                        id="express-customer-phone"
                        name="customerPhone"
                        type="tel"
                        inputMode="tel"
                        value={customerPhone}
                        onChange={(event) => handlePhoneChange(event.currentTarget.value)}
                        maxLength={15}
                        placeholder="(34) 99999-9999"
                        className="h-12 rounded-xl"
                      />

                      {fieldErrors.customerPhone && (
                        <p role="alert" className="text-sm text-destructive">
                          {fieldErrors.customerPhone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="express-customer-email">E-mail (opcional)</Label>

                      <Input
                        id="express-customer-email"
                        name="customerEmail"
                        type="email"
                        maxLength={254}
                        className="h-12 rounded-xl"
                      />

                      {fieldErrors.customerEmail && (
                        <p role="alert" className="text-sm text-destructive">
                          {fieldErrors.customerEmail}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t border-border pt-6">
                <h3 className="font-heading text-lg font-semibold">2. Serviço e valor</h3>

                <div className="space-y-2">
                  <Label htmlFor="express-quote-title">Título do orçamento *</Label>

                  <Input
                    id="express-quote-title"
                    name="title"
                    maxLength={150}
                    placeholder="Ex.: Limpeza de estofados"
                    className="h-12 rounded-xl"
                  />

                  {fieldErrors.title && (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="express-service-name">Serviço *</Label>

                  <Input
                    id="express-service-name"
                    name="name"
                    maxLength={100}
                    placeholder="Ex.: Limpeza de sofá de 3 lugares"
                    className="h-12 rounded-xl"
                  />

                  {fieldErrors.name && (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="express-quantity">Quantidade *</Label>

                    <Input
                      id="express-quantity"
                      value={quantity}
                      onChange={(event) => setQuantity(event.currentTarget.value)}
                      inputMode="decimal"
                      placeholder="1"
                      className="h-12 rounded-xl"
                    />

                    {fieldErrors.quantity && (
                      <p role="alert" className="text-sm text-destructive">
                        {fieldErrors.quantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="express-amount">Valor unitário (R$) *</Label>

                    <Input
                      id="express-amount"
                      value={unitAmount}
                      onChange={(event) => setUnitAmount(event.currentTarget.value)}
                      inputMode="decimal"
                      placeholder="0,00"
                      className="h-12 rounded-xl"
                    />

                    {fieldErrors.unitAmountInCents && (
                      <p role="alert" className="text-sm text-destructive">
                        {fieldErrors.unitAmountInCents}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Total estimado</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {totalInCents === null ? '—' : formatBrlCurrency(totalInCents)}
                  </p>
                </div>
              </section>

              <section className="space-y-4 border-t border-border pt-6">
                <h3 className="font-heading text-lg font-semibold">3. Detalhes</h3>

                <div className="space-y-2">
                  <Label htmlFor="express-valid-until">Validade</Label>

                  <DateTimePicker
                    id="express-valid-until"
                    name="validUntil"
                    defaultValue={defaultValidity}
                    minuteStep={15}
                    clearable
                    ariaInvalid={Boolean(fieldErrors.validUntil)}
                    placeholder="Selecione a validade"
                  />

                  {fieldErrors.validUntil && (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.validUntil}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Condição de pagamento</Label>

                  <Select<QuotePaymentCondition>
                    items={quotePaymentConditionOptions}
                    value={paymentCondition}
                    onValueChange={(value) => value && setPaymentCondition(value)}
                  >
                    <SelectTrigger aria-label="Condição de pagamento" className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {quotePaymentConditionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldErrors.paymentCondition && (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.paymentCondition}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {getQuotePaymentConditionDescription(
                      paymentCondition,
                      paymentCondition === 'DOWN_PAYMENT_AND_BALANCE' ? Number(downPaymentPercentage) : null,
                    )}
                  </p>
                </div>

                {paymentCondition === 'DOWN_PAYMENT_AND_BALANCE' && (
                  <div className="space-y-2">
                    <Label htmlFor="express-down-payment">Percentual da entrada (%) *</Label>

                    <Input
                      id="express-down-payment"
                      type="number"
                      min={1}
                      max={99}
                      step={1}
                      value={downPaymentPercentage}
                      onChange={(event) => setDownPaymentPercentage(event.currentTarget.value)}
                      className="h-12 rounded-xl"
                    />

                    {fieldErrors.downPaymentPercentage && (
                      <p role="alert" className="text-sm text-destructive">
                        {fieldErrors.downPaymentPercentage}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="express-notes">Observações</Label>

                  <Textarea
                    id="express-notes"
                    name="notes"
                    maxLength={5000}
                    placeholder="Informações importantes para a proposta"
                    className="min-h-24 rounded-xl"
                  />
                </div>
              </section>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                A proposta será salva como rascunho. Você poderá adicionar outros itens e compartilhar na tela seguinte.
              </p>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={onStandard}
                className="cursor-pointer"
              >
                <FileText aria-hidden="true" className="size-4" />
                Modo detalhado
              </Button>

              <Button type="submit" disabled={submitting} className="min-h-11 cursor-pointer rounded-xl px-5">
                {submitting ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <ArrowRight aria-hidden="true" className="size-4" />
                )}

                {submitting ? 'Salvando...' : 'Criar orçamento'}
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
