export type DatePickerMode = 'date' | 'datetime';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const monthYearFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function parseDatePickerValue(value: string | undefined, mode: DatePickerMode): Date | null {
  if (!value) {
    return null;
  }

  const match =
    mode === 'date' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = mode === 'datetime' ? Number(match[4]) : 0;
  const minute = mode === 'datetime' ? Number(match[5]) : 0;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}

export function formatDatePickerValue(date: Date, mode: DatePickerMode): string {
  const dateValue = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  if (mode === 'date') {
    return dateValue;
  }

  return `${dateValue}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDatePickerDisplay(date: Date, mode: DatePickerMode): string {
  if (mode === 'date') {
    return dateFormatter.format(date);
  }

  return dateTimeFormatter.format(date).replace(',', ' às');
}

export function formatMonthYear(date: Date): string {
  const value = monthYearFormatter.format(date);

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function buildCalendarDays(month: Date): Date[] {
  const firstDay = startOfMonth(month);

  const start = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - firstDay.getDay());

  return Array.from(
    {
      length: 42,
    },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isCalendarDayDisabled(date: Date, min?: Date, max?: Date): boolean {
  const candidate = startOfDay(date).getTime();

  if (min && candidate < startOfDay(min).getTime()) {
    return true;
  }

  if (max && candidate > startOfDay(max).getTime()) {
    return true;
  }

  return false;
}

export function isDateTimeWithinLimits(value: Date, min?: Date, max?: Date): boolean {
  if (min && value.getTime() < min.getTime()) {
    return false;
  }

  if (max && value.getTime() > max.getTime()) {
    return false;
  }

  return true;
}

export function roundUpToMinuteStep(date: Date, minuteStep: number): Date {
  const result = new Date(date);

  const minutes = result.getMinutes();
  const remainder = minutes % minuteStep;

  const containsSeconds = result.getSeconds() !== 0 || result.getMilliseconds() !== 0;

  let minutesToAdd = remainder === 0 ? 0 : minuteStep - remainder;

  if (remainder === 0 && containsSeconds) {
    minutesToAdd = minuteStep;
  }

  result.setSeconds(0, 0);

  if (minutesToAdd > 0) {
    result.setMinutes(result.getMinutes() + minutesToAdd);
  }

  return result;
}

export function toMinutePrecision(date: Date): Date {
  const result = new Date(date);

  result.setSeconds(0, 0);

  return result;
}
