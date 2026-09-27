'use client';

import { CalendarDays, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

import { CalendarMonth } from './components/calendarMonth';
import { TimePicker } from './components/timePicker';
import {
  type DatePickerMode,
  formatDatePickerDisplay,
  formatDatePickerValue,
  isDateTimeWithinLimits,
  parseDatePickerValue,
  roundUpToMinuteStep,
  startOfMonth,
  toMinutePrecision,
} from './helpers/datePicker.helper';

interface PanelPosition {
  top: number;
  left: number;
  width: number;
}

export interface DatePickerFieldProps {
  id: string;
  name: string;
  mode: DatePickerMode;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  minuteStep?: number;
  min?: Date;
  max?: Date;
  ariaInvalid?: boolean;
  className?: string;
  onValueChange?(value: string): void;
}

export function DatePickerField({
  id,
  name,
  mode,
  defaultValue = '',
  value,
  placeholder,
  disabled = false,
  clearable = false,
  minuteStep = 15,
  min,
  max,
  ariaInvalid,
  className,
  onValueChange,
}: DatePickerFieldProps) {
  const controlled = value !== undefined;

  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [position, setPosition] = useState<PanelPosition>({
    top: 0,
    left: 0,
    width: 360,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentValue = controlled ? value : internalValue;

  const selectedDate = parseDatePickerValue(currentValue, mode);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();

    const viewportPadding = 12;

    const width = Math.min(360, window.innerWidth - viewportPadding * 2);

    const panelHeight = panelRef.current?.offsetHeight ?? (mode === 'datetime' ? 480 : 390);

    let left = rect.left;

    if (left + width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - width - viewportPadding;
    }

    left = Math.max(viewportPadding, left);

    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;

    const spaceAbove = rect.top - viewportPadding;

    let top = rect.bottom + 8;

    if (spaceBelow < panelHeight && spaceAbove > spaceBelow) {
      top = rect.top - panelHeight - 8;
    }

    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - panelHeight - viewportPadding));

    setPosition({
      top,
      left,
      width,
    });
  }, [mode]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
  }, [open, updatePosition, draftDate, month]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (!(event.target instanceof Node)) {
        return;
      }

      const insideTrigger = triggerRef.current?.contains(event.target);

      const insidePanel = panelRef.current?.contains(event.target);

      if (!insideTrigger && !insidePanel) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);

        triggerRef.current?.focus();
      }
    }

    function handleViewportChange(): void {
      updatePosition();
    }

    document.addEventListener('pointerdown', handlePointerDown);

    document.addEventListener('keydown', handleKeyDown);

    window.addEventListener('resize', handleViewportChange);

    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);

      document.removeEventListener('keydown', handleKeyDown);

      window.removeEventListener('resize', handleViewportChange);

      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, updatePosition]);

  function commit(nextValue: string): void {
    if (!controlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function createFallbackDraft(): Date {
    const now = new Date();

    if (mode === 'date') {
      return now;
    }

    if (min && min.getTime() >= now.getTime()) {
      return roundUpToMinuteStep(min, minuteStep);
    }

    if (max && max.getTime() <= now.getTime()) {
      return toMinutePrecision(max);
    }

    return roundUpToMinuteStep(now, minuteStep);
  }

  function openPicker(): void {
    if (disabled) {
      return;
    }

    const initialDate = selectedDate ?? createFallbackDraft();

    setDraftDate(initialDate);

    setMonth(startOfMonth(initialDate));

    setOpen(true);
  }

  function togglePicker(): void {
    if (open) {
      setOpen(false);

      return;
    }

    openPicker();
  }

  function selectDate(date: Date): void {
    if (mode === 'date') {
      commit(formatDatePickerValue(date, 'date'));

      setOpen(false);

      triggerRef.current?.focus();

      return;
    }

    const next = draftDate ? new Date(draftDate) : createFallbackDraft();

    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

    setDraftDate(next);

    setMonth(startOfMonth(date));
  }

  function selectToday(): void {
    let today = new Date();

    if (mode === 'datetime') {
      if (min && min.getTime() >= today.getTime()) {
        today = roundUpToMinuteStep(min, minuteStep);
      } else if (max && max.getTime() <= today.getTime()) {
        today = toMinutePrecision(max);
      } else {
        today = toMinutePrecision(today);
      }
    }

    if (mode === 'date') {
      commit(formatDatePickerValue(today, mode));

      setOpen(false);

      triggerRef.current?.focus();

      return;
    }

    setDraftDate(today);

    setMonth(startOfMonth(today));
  }

  function clear(): void {
    commit('');

    setDraftDate(null);

    setOpen(false);

    triggerRef.current?.focus();
  }

  function applyDateTime(): void {
    if (!draftDate || !isDateTimeWithinLimits(draftDate, min, max)) {
      return;
    }

    commit(formatDatePickerValue(draftDate, mode));

    setOpen(false);

    triggerRef.current?.focus();
  }

  const displayValue = selectedDate ? formatDatePickerDisplay(selectedDate, mode) : '';

  const validDraft = draftDate !== null && isDateTimeWithinLimits(draftDate, min, max);

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={currentValue}
        disabled={disabled}
        readOnly
        aria-invalid={ariaInvalid || undefined}
      />

      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={togglePicker}
        className={cn(
          'flex h-12 w-full cursor-pointer items-center gap-3 rounded-xl border border-input bg-transparent px-3.5 text-left text-sm transition-colors outline-none',
          'hover:bg-muted/30',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          open && 'border-ring ring-3 ring-ring/20',
          className,
        )}
      >
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />

        <span className={cn('min-w-0 flex-1 truncate', !displayValue && 'text-muted-foreground')}>
          {displayValue || placeholder || (mode === 'date' ? 'Selecione uma data' : 'Selecione data e horário')}
        </span>

        <ChevronDown
          aria-hidden="true"
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={mode === 'date' ? 'Selecionar data' : 'Selecionar data e horário'}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-100 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl"
          >
            <CalendarMonth
              month={month}
              selected={draftDate}
              min={min}
              max={max}
              disabled={disabled}
              onMonthChange={setMonth}
              onSelect={selectDate}
            />

            {mode === 'datetime' && draftDate && (
              <div className="mt-4 border-t border-border pt-4">
                <TimePicker value={draftDate} minuteStep={minuteStep} disabled={disabled} onChange={setDraftDate} />

                {!validDraft && (
                  <p role="alert" className="mt-3 text-xs text-destructive">
                    O horário selecionado está fora do período permitido.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <div>
                {clearable && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={clear}
                    className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={selectToday}
                  className="h-9 cursor-pointer rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  {mode === 'date' ? 'Hoje' : 'Agora'}
                </button>

                {mode === 'datetime' && (
                  <button
                    type="button"
                    disabled={disabled || !validDraft}
                    onClick={applyDateTime}
                    className="h-9 cursor-pointer rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
