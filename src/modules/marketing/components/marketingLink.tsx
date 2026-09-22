import Link from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type MarketingLinkProps = ComponentProps<typeof Link> & {
  variant?: 'primary' | 'outline' | 'inverse';
};

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-transparent text-foreground hover:bg-accent',
  inverse: 'bg-brand-foreground text-brand hover:bg-brand-foreground/90',
};

export function MarketingLink({ variant = 'primary', className, children, ...props }: MarketingLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
        'motion-safe:transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
