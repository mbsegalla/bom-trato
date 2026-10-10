import Image from 'next/image';

import { cn } from '@/lib/utils';

type BrandLogoVariant = 'horizontal' | 'horizontal-light' | 'vertical' | 'mark' | 'app';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  alt?: string;
  className?: string;
  priority?: boolean;
}

const assets: Record<
  BrandLogoVariant,
  {
    src: string;
    width: number;
    height: number;
  }
> = {
  horizontal: {
    src: '/brand/bom-trato-logo-horizontal.png',
    width: 2077,
    height: 655,
  },
  'horizontal-light': {
    src: '/brand/bom-trato-logo-horizontal-light.png',
    width: 1933,
    height: 724,
  },
  vertical: {
    src: '/brand/bom-trato-logo-vertical.png',
    width: 1035,
    height: 1044,
  },
  mark: {
    src: '/brand/bom-trato-mark.png',
    width: 1197,
    height: 1047,
  },
  app: {
    src: '/brand/bom-trato-app-icon.png',
    width: 512,
    height: 512,
  },
};

export function BrandLogo({ variant = 'horizontal', alt = 'Bom Trato', className, priority = false }: BrandLogoProps) {
  const asset = assets[variant];

  return (
    <Image
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={cn('h-auto object-contain', className)}
    />
  );
}
