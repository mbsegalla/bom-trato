import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';

interface TabButtonProps extends Omit<ComponentProps<typeof Button>, 'variant'> {
  active: boolean;
}

function TabButton({ active, className, ...props }: TabButtonProps) {
  return (
    <Button
      {...props}
      variant="ghost"
      className={cn(
        'cursor-pointer rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-1 hover:bg-transparent hover:text-primary',
        active && 'border-primary text-primary hover:text-primary',
        className,
      )}
    />
  );
}

export { TabButton };
