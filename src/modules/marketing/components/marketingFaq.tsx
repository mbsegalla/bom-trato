import { ChevronDown } from 'lucide-react';

import { marketingFaqs } from '../data/marketing.data';

export function MarketingFaq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border px-6 py-12 sm:py-16 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Tudo o que você precisa saber</p>

          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Ficou alguma dúvida?</h2>

          <p className="mt-4 leading-relaxed text-muted-foreground">
            Entenda como funciona a avaliação gratuita e descubra como o Bom Trato se encaixa na rotina de quem presta
            serviços.
          </p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {marketingFaqs.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 rounded-sm py-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                {faq.question}

                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
                />
              </summary>

              <p className="pr-8 pb-6 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
