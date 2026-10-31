'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTheme } from '@/modules/theme/components/themeProvider';
import type { ThemePreference } from '@/modules/theme/types/theme.types';

const options: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof Monitor;
}> = [
  {
    value: 'system',
    label: 'Sistema',
    description: 'Acompanha automaticamente a aparência definida no seu dispositivo.',
    icon: Monitor,
  },
  {
    value: 'light',
    label: 'Claro',
    description: 'Mantém o Bom Trato sempre com a aparência clara.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Usa uma aparência escura, ideal para ambientes com pouca luz.',
    icon: Moon,
  },
];

export function AppearanceSettings() {
  const { theme, ready, setTheme } = useTheme();

  return (
    <section aria-busy={!ready}>
      <div>
        <h2 className="font-heading text-xl font-semibold">Aparência</h2>

        <p className="mt-1 text-sm text-muted-foreground">Escolha como o Bom Trato deve aparecer neste dispositivo.</p>
      </div>

      <div className="mt-6 divide-y divide-border border-y border-border">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = ready && theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={!ready}
              aria-pressed={selected}
              onClick={() => setTheme(option.value)}
              className="flex w-full cursor-pointer items-center gap-4 py-5 text-left transition-colors hover:text-primary disabled:cursor-wait disabled:opacity-60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Icon aria-hidden="true" className="size-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-medium">{option.label}</span>

                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{option.description}</span>
              </span>

              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border border-border',
                  selected && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {selected && <Check aria-hidden="true" className="size-3.5" />}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        A preferência é salva neste navegador e pode ser alterada a qualquer momento.
      </p>
    </section>
  );
}
