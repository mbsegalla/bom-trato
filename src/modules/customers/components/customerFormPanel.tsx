'use client';

import { LoaderCircle, Mail, Phone, StickyNote, UserRound, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBrazilianPhone, formatBrazilianPhoneInput } from '@/shared/formatters/phone.formatter';

import { customerFormSchema } from '../schemas/customer.schema';
import { createCustomer, updateCustomer } from '../services/customer.service';
import type { Customer, CustomerFormInput } from '../types/customer.types';

interface CustomerFormPanelProps {
  organizationId: string;
  customer?: Customer;
  onClose(): void;
  onSaved(customer: Customer): void;
}

type CustomerFieldErrors = Partial<Record<keyof CustomerFormInput, string>>;

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function CustomerFormPanel({ organizationId, customer, onClose, onSaved }: CustomerFormPanelProps) {
  const submittingRef = useRef(false);

  const [phone, setPhone] = useState(formatBrazilianPhone(customer?.phone));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CustomerFieldErrors>({});

  const editing = customer !== undefined;

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const parsed = customerFormSchema.safeParse({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      notes: String(formData.get('notes') ?? ''),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        name: firstError(errors.name),
        email: firstError(errors.email),
        phone: firstError(errors.phone),
        notes: firstError(errors.notes),
      });

      return;
    }

    submittingRef.current = true;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const savedCustomer = editing
        ? await updateCustomer(organizationId, customer.id, parsed.data)
        : await createCustomer(organizationId, parsed.data);

      onSaved(savedCustomer);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o cliente.');
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
        aria-labelledby="customer-form-title"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border bg-background shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id="customer-form-title" className="font-heading text-2xl font-semibold tracking-tight">
              {editing ? 'Editar cliente' : 'Novo cliente'}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? 'Atualize os dados de contato e as observações do cliente.'
                : 'Cadastre as informações principais para começar.'}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar"
            disabled={submitting}
            onClick={onClose}
            className="cursor-pointer"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <fieldset disabled={submitting} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nome *</Label>

                <div className="relative">
                  <UserRound
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    id="customer-name"
                    name="name"
                    defaultValue={customer?.name ?? ''}
                    autoComplete="name"
                    autoFocus
                    maxLength={100}
                    aria-invalid={fieldErrors.name ? true : undefined}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.name && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-email">E-mail</Label>

                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    id="customer-email"
                    name="email"
                    type="email"
                    defaultValue={customer?.email ?? ''}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={254}
                    aria-invalid={fieldErrors.email ? true : undefined}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.email && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">Telefone</Label>

                <div className="relative">
                  <Phone
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    id="customer-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    autoComplete="tel"
                    maxLength={15}
                    placeholder="(34) 99999-9999"
                    aria-invalid={fieldErrors.phone ? true : undefined}
                    onChange={(event) => {
                      setPhone(formatBrazilianPhoneInput(event.currentTarget.value));

                      if (fieldErrors.phone) {
                        setFieldErrors((current) => ({
                          ...current,
                          phone: undefined,
                        }));
                      }
                    }}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.phone && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-notes">Observações</Label>

                <div className="relative">
                  <StickyNote
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground"
                  />

                  <Textarea
                    id="customer-notes"
                    name="notes"
                    defaultValue={customer?.notes ?? ''}
                    maxLength={5000}
                    aria-invalid={fieldErrors.notes ? true : undefined}
                    className="min-h-36 rounded-xl pl-11"
                  />
                </div>

                <div className="flex justify-between gap-4">
                  {fieldErrors.notes ? (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.notes}
                    </p>
                  ) : (
                    <span />
                  )}

                  <span className="text-xs text-muted-foreground">Máximo de 5000 caracteres</span>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
                >
                  {error}
                </p>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
                className="min-h-11 cursor-pointer rounded-xl px-5"
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting} className="min-h-11 cursor-pointer rounded-xl px-5">
                {submitting ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : editing ? (
                  'Salvar alterações'
                ) : (
                  'Cadastrar cliente'
                )}
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
