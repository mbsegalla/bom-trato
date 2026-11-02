'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
): React.JSX.Element {
  return <SelectPrimitive.Root {...props} />;
}

type SelectTriggerProps = Omit<SelectPrimitive.Trigger.Props, 'className'> & {
  className?: string;
};

function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    >
      {children}

      <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
        <ChevronDown aria-hidden="true" className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

const SelectValue = SelectPrimitive.Value;

type SelectContentProps = Omit<SelectPrimitive.Popup.Props, 'className'> & {
  className?: string;
  alignItemWithTrigger?: boolean;
};

function SelectContent({ className, children, alignItemWithTrigger = false, ...props }: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={4}
        alignItemWithTrigger={alignItemWithTrigger}
        className="z-80 w-(--anchor-width)"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            'max-h-(--available-height) w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg',
            className,
          )}
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow className="flex h-7 items-center justify-center text-muted-foreground">
            <ChevronUp aria-hidden="true" className="size-4" />
          </SelectPrimitive.ScrollUpArrow>

          <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>

          <SelectPrimitive.ScrollDownArrow className="flex h-7 items-center justify-center text-muted-foreground">
            <ChevronDown aria-hidden="true" className="size-4" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

type SelectItemProps = Omit<SelectPrimitive.Item.Props, 'className'> & {
  className?: string;
};

function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex min-h-9 cursor-pointer items-center rounded-lg py-2 pr-3 pl-9 text-sm outline-none select-none data-highlighted:bg-muted data-highlighted:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-3 flex size-4 items-center justify-center text-primary">
        <Check aria-hidden="true" className="size-4" />
      </SelectPrimitive.ItemIndicator>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
