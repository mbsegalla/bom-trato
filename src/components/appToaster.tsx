'use client';

import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert, X } from 'lucide-react';
import { Toaster } from 'sonner';

import { useTheme } from '@/modules/theme/components/themeProvider';

export function AppToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="top-right"
      closeButton
      visibleToasts={4}
      duration={4000}
      containerAriaLabel="Notificações"
      icons={{
        success: (
          <span className="flex size-7 items-center justify-center rounded-full bg-success-surface text-success">
            <CircleCheck className="size-4" aria-hidden="true" />
          </span>
        ),
        error: (
          <span className="flex size-7 items-center justify-center rounded-full bg-danger-surface text-destructive">
            <CircleX className="size-4" aria-hidden="true" />
          </span>
        ),
        warning: (
          <span className="flex size-7 items-center justify-center rounded-full bg-warning-surface text-warning">
            <TriangleAlert className="size-4" aria-hidden="true" />
          </span>
        ),
        info: (
          <span className="flex size-7 items-center justify-center rounded-full bg-info-surface text-info">
            <Info className="size-4" aria-hidden="true" />
          </span>
        ),
        loading: (
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-primary">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          </span>
        ),
        close: <X className="size-3.5" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: 'Fechar notificação',
        classNames: {
          toast:
            'relative flex w-full items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-4 pr-11 text-card-foreground shadow-lg',
          success: 'border-l-success',
          error: 'border-l-destructive',
          warning: 'border-l-warning',
          info: 'border-l-info',
          loading: 'border-l-primary',
          default: 'border-l-primary',
          icon: 'shrink-0',
          content: 'flex min-w-0 flex-1 flex-col gap-1',
          title: 'text-sm font-medium leading-5 text-foreground',
          description: 'text-sm leading-5 text-muted-foreground',
          closeButton:
            'absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          actionButton:
            'rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80',
          cancelButton:
            'rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent',
        },
      }}
    />
  );
}
