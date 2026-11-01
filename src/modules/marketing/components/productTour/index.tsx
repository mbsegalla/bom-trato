'use client';

import { ArrowRight, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ProductTourShell } from './components/productTourShell';
import { type ProductTourId, productTourItems } from './data/productTour.data';

export function ProductTour() {
  const [activeId, setActiveId] = useState<ProductTourId>('overview');

  const stepRefs = useRef<Partial<Record<ProductTourId, HTMLElement | null>>>({});

  useEffect(() => {
    const desktopMedia = window.matchMedia('(min-width: 1024px)');

    let animationFrame: number | null = null;

    function updateActiveStep(): void {
      if (!desktopMedia.matches) {
        return;
      }

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        const activationLine = window.innerHeight * 0.42;

        let closestId: ProductTourId | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        productTourItems.forEach(({ id }) => {
          const element = stepRefs.current[id];

          if (!element) {
            return;
          }

          const rect = element.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const distance = Math.abs(center - activationLine);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestId = id;
          }
        });

        if (closestId !== null) {
          setActiveId(closestId);
        }
      });
    }

    updateActiveStep();

    window.addEventListener('scroll', updateActiveStep, { passive: true });
    window.addEventListener('resize', updateActiveStep);

    desktopMedia.addEventListener('change', updateActiveStep);

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener('scroll', updateActiveStep);
      window.removeEventListener('resize', updateActiveStep);

      desktopMedia.removeEventListener('change', updateActiveStep);
    };
  }, []);

  function selectDesktopStep(id: ProductTourId): void {
    setActiveId(id);

    const element = stepRefs.current[id];

    if (!element) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    element.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  }

  return (
    <section id="product-tour" className="scroll-mt-24 px-6 py-12 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Veja o Bom Trato por dentro</p>

          <h2 className="mt-4 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Entenda o fluxo.
            <span className="text-primary"> Veja o produto funcionando.</span>
          </h2>

          <p className="mt-5 leading-relaxed text-muted-foreground">
            Percorra as áreas do sistema e veja como oportunidades, clientes, propostas, execução, agenda e recebimentos
            trabalham juntos durante a rotina.
          </p>
        </div>

        <div className="mt-8 lg:hidden">
          <div
            role="tablist"
            aria-label="Áreas do Bom Trato"
            className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0"
          >
            {productTourItems.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeId === id}
                onClick={() => setActiveId(id)}
                className={
                  activeId === id
                    ? 'shrink-0 cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground'
                    : 'shrink-0 cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground'
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <ProductTourShell activeId={activeId} onSelect={setActiveId} />
          </div>
        </div>

        <div className="mt-10 hidden grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-12 lg:grid xl:gap-16">
          <div>
            <div className="border-y border-border">
              {productTourItems.map(({ id, eyebrow, title, description, icon: Icon }, index) => {
                const active = activeId === id;

                return (
                  <article
                    key={id}
                    ref={(element) => {
                      stepRefs.current[id] = element;
                    }}
                    data-product-tour-step={id}
                    className={
                      index === 0 ? 'flex min-h-48 items-center' : 'flex min-h-48 items-center border-t border-border'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => selectDesktopStep(id)}
                      className="grid w-full cursor-pointer grid-cols-[3rem_minmax(0,1fr)] items-start gap-5 py-6 text-left"
                    >
                      <span
                        className={
                          active
                            ? 'flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground'
                            : 'flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'
                        }
                      >
                        <Icon aria-hidden="true" className="size-4.5" strokeWidth={1.7} />
                      </span>

                      <span className="min-w-0">
                        <span className="flex items-center gap-3">
                          <span
                            className={
                              active ? 'text-xs font-medium text-primary' : 'text-xs font-medium text-muted-foreground'
                            }
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <span
                            className={
                              active
                                ? 'text-xs font-semibold tracking-wide text-primary uppercase'
                                : 'text-xs font-semibold tracking-wide text-muted-foreground uppercase'
                            }
                          >
                            {eyebrow}
                          </span>
                        </span>

                        <span
                          className={
                            active
                              ? 'mt-3 block text-xl font-semibold tracking-tight text-foreground'
                              : 'mt-3 block text-xl font-semibold tracking-tight text-muted-foreground'
                          }
                        >
                          {title}
                        </span>

                        <span className="mt-3 block max-w-md text-sm leading-relaxed text-muted-foreground">
                          {description}
                        </span>
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="flex min-h-112 items-start pt-10">
              <div className="max-w-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-success-surface text-success">
                  <Check aria-hidden="true" className="size-5" />
                </div>

                <p className="mt-5 text-xs font-semibold tracking-wide text-primary uppercase">Fluxo completo</p>

                <h3 className="mt-3 text-xl font-semibold tracking-tight">Do primeiro contato ao recebimento.</h3>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  O Bom Trato mantém as etapas conectadas para que você acompanhe o trabalho sem reconstruir o contexto
                  a cada avanço.
                </p>

                <a
                  href="#pricing"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Conhecer os planos
                  <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="sticky top-24">
              <div aria-hidden="true" className="absolute -inset-5 rounded-[3rem] bg-primary/10 blur-sm" />

              <div className="relative">
                <ProductTourShell activeId={activeId} onSelect={selectDesktopStep} />
              </div>

              <p className="relative mt-4 text-center text-xs text-muted-foreground">
                Demonstração com dados fictícios baseada na interface atual do Bom Trato.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
