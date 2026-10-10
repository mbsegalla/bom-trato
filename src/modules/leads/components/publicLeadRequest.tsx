'use client';

import { CheckCircle2, LoaderCircle, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBrazilianPhoneInput } from '@/shared/formatters/phone.formatter';

import { publicLeadFormSchema } from '../schemas/lead.schema';
import { createPublicLead } from '../services/publicLead.service';

interface PublicLeadService {
  id: string;
  name: string;
}

interface PublicLeadRequestProps {
  slug: string;
  professionalName: string;
  services: PublicLeadService[];
}

export function PublicLeadRequest({ slug, professionalName, services }: PublicLeadRequestProps) {
  const requestKeyRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);

    const parsed = publicLeadFormSchema.safeParse({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone,
      catalogServiceId: String(data.get('catalogServiceId') ?? '') || null,
      message: String(data.get('message') ?? ''),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os dados informados.');
      return;
    }

    const requestKey = requestKeyRef.current ?? crypto.randomUUID();

    requestKeyRef.current = requestKey;

    setSubmitting(true);
    setError(null);

    try {
      await createPublicLead(slug, requestKey, parsed.data);

      requestKeyRef.current = null;
      setSubmitted(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar sua solicitação.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="min-h-12 cursor-pointer rounded-xl px-5">
        <Send aria-hidden="true" className="size-4" />
        Solicitar orçamento
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-70 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Solicitar orçamento</h2>
            <p className="mt-1 text-sm text-muted-foreground">Envie sua solicitação para {professionalName}.</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </header>

        {submitted ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div className="max-w-sm">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-surface text-success">
                <CheckCircle2 className="size-7" />
              </span>

              <h3 className="mt-5 text-xl font-semibold">Solicitação enviada</h3>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {professionalName} recebeu sua solicitação e poderá entrar em contato pelos dados informados.
              </p>

              <Button type="button" onClick={() => setOpen(false)} className="mt-6 cursor-pointer">
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit(event.currentTarget);
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <fieldset disabled={submitting} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="lead-name">Nome *</Label>
                  <Input id="lead-name" name="name" maxLength={100} className="h-12 rounded-xl" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lead-email">E-mail</Label>
                    <Input id="lead-email" name="email" type="email" maxLength={254} className="h-12 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead-phone">Telefone *</Label>
                    <Input
                      id="lead-phone"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      maxLength={15}
                      required
                      onChange={(event) => setPhone(formatBrazilianPhoneInput(event.currentTarget.value))}
                      placeholder="(34) 99999-9999"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                {services.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="lead-service">Serviço</Label>

                    <select
                      id="lead-service"
                      name="catalogServiceId"
                      defaultValue=""
                      className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Ainda não sei / outro serviço</option>

                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="lead-message">O que você precisa? *</Label>

                  <Textarea
                    id="lead-message"
                    name="message"
                    maxLength={2000}
                    placeholder="Conte o que precisa, detalhes do serviço e informações que podem ajudar no orçamento."
                    className="min-h-40 rounded-xl"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Seus dados serão compartilhados com {professionalName} exclusivamente para atendimento desta
                  solicitação. O profissional poderá entrar em contato pelo WhatsApp.
                </p>
              </div>

              <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
                  Cancelar
                </Button>

                <Button type="submit" disabled={submitting} className="cursor-pointer">
                  {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                  Enviar solicitação
                </Button>
              </footer>
            </fieldset>
          </form>
        )}
      </section>
    </div>
  );
}
