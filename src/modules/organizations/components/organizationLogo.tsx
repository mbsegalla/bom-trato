import { Store } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface OrganizationLogoProps {
  name: string;
  logoUrl: string | null;
  variant?: 'initials' | 'store';
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function OrganizationLogo({ name, logoUrl, variant = 'initials', className }: OrganizationLogoProps) {
  return (
    <div
      title={name}
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-muted text-sm font-semibold text-primary',
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo de ${name}`}
          width={80}
          height={80}
          className="h-full w-full object-contain p-1"
        />
      ) : variant === 'store' ? (
        <Store aria-hidden="true" className="size-5" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </div>
  );
}
