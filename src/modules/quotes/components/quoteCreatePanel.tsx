'use client';

import { CalendarDays, FileText, LoaderCircle, Search, StickyNote, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { InlineOptionsSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SessionError } from '@/modules/auth/services/session.service';
import { listCustomers } from '@/modules/customers/services/customer.service';
import type { CustomerPage } from '@/modules/customers/types/customer.types';
import { formatDateTimeLocalInput } from '@/shared/formatters/date.formatter';

import { createQuoteFormSchema } from '../schemas/quote.schema';
import { createQuote } from '../services/quote.service';
import type { CreateQuoteInput, Quote } from '../types/quote.types';

interface QuoteCreatePanelProps {
  organizationId: string;
  onClose(): void;
  onCreated(quote: Quote): void;
}

interface CustomerState {
  requestKey: string;
  data: CustomerPage;
}

type FieldErrors = Partial<Record<keyof CreateQuoteInput, string>>;

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function QuoteCreatePanel({ organizationId, onClose, onCreated }: QuoteCreatePanelProps) {
  const router = useRouter();

  const submittingRef = useRef(false);

  const [customerSearchDraft, setCustomerSearchDraft] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [defaultValidity] = useState(() => formatDateTimeLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));

  const requestKey = `${organizationId}:${customerSearch}`;

  useEffect(() => {
    let active = true;

    void listCustomers(organizationId, {
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      search: customerSearch,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        setCustomerError(null);

        setCustomerState({
          requestKey,
          data: result,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setCustomerError(cause instanceof Error ? cause.message : 'Não foi possível carregar seus clientes.');
      });

    return () => {
      active = false;
    };
  }, [customerSearch, organizationId, requestKey, router]);

  const customers = customerState?.requestKey === requestKey ? customerState.data.items : null;

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = createQuoteFormSchema.safeParse({
      customerId: String(data.get('customerId') ?? ''),
      title: String(data.get('title') ?? ''),
      notes: String(data.get('notes') ?? ''),
      validUntil: String(data.get('validUntil') ?? ''),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        customerId: firstError(errors.customerId),
        title: firstError(errors.title),
        notes: firstError(errors.notes),
        validUntil: firstError(errors.validUntil),
      });

      return;
    }

    submittingRef.current = true;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const quote = await createQuote(organizationId, parsed.data);

      onCreated(quote);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar o orçamento.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Novo orçamento</h2>

            <p className="mt-1 text-sm text-muted-foreground">Comece pelo cliente e pelas informações principais.</p>
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
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="quote-customer-search">Cliente *</Label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />

                    <Input
                      id="quote-customer-search"
                      type="search"
                      value={customerSearchDraft}
                      onChange={(event) => setCustomerSearchDraft(event.target.value)}
                      placeholder="Buscar cliente..."
                      className="h-11 rounded-xl pl-10"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCustomerSearch(customerSearchDraft.trim())}
                    className="min-h-11 cursor-pointer rounded-xl"
                  >
                    Buscar
                  </Button>
                </div>

                {customerError && <p className="text-sm text-destructive">{customerError}</p>}

                {!customers ? (
                  <InlineOptionsSkeleton />
                ) : customers.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Nenhum cliente ativo encontrado.{' '}
                    <Link href="/customers" className="font-medium text-primary underline">
                      Cadastrar cliente
                    </Link>
                  </div>
                ) : (
                  <div className="relative">
                    <UserRound
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />

                    <select
                      name="customerId"
                      defaultValue=""
                      className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background pr-3 pl-11 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="" disabled>
                        Selecione um cliente
                      </option>

                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {fieldErrors.customerId && <p className="text-sm text-destructive">{fieldErrors.customerId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-title">Título *</Label>

                <div className="relative">
                  <FileText
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    id="quote-title"
                    name="title"
                    maxLength={150}
                    placeholder="Ex.: Instalação elétrica"
                    className="h-12 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-valid-until">Validade</Label>

                <div className="relative">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    id="quote-valid-until"
                    name="validUntil"
                    type="datetime-local"
                    defaultValue={defaultValidity}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.validUntil && <p className="text-sm text-destructive">{fieldErrors.validUntil}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-notes">Observações</Label>

                <div className="relative">
                  <StickyNote
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground"
                  />

                  <Textarea
                    id="quote-notes"
                    name="notes"
                    maxLength={5000}
                    placeholder="Condições, detalhes do serviço ou informações importantes."
                    className="min-h-32 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.notes && <p className="text-sm text-destructive">{fieldErrors.notes}</p>}
              </div>

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
                className="cursor-pointer"
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting || customers?.length === 0} className="cursor-pointer">
                {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                Criar orçamento
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
