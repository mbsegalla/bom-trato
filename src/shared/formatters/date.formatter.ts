const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
});

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

const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const monthYearFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
});

export function formatTime(date: Date | null, fallback = 'A definir'): string {
  if (date === null) {
    return fallback;
  }

  return timeFormatter.format(date);
}

export function formatShortDate(date: Date | null, fallback = 'Sem data'): string {
  if (date === null) {
    return fallback;
  }

  return shortDateFormatter.format(date);
}

export function formatDate(date: Date | null, fallback = 'Sem data'): string {
  if (date === null) {
    return fallback;
  }

  return dateFormatter.format(date);
}

export function formatDateTime(date: Date | null, fallback = 'Sem data'): string {
  if (date === null) {
    return fallback;
  }

  return dateTimeFormatter.format(date);
}

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

export function formatMonthYear(date: Date): string {
  return monthYearFormatter.format(date);
}

export function formatWeekday(date: Date): string {
  return weekdayFormatter.format(date);
}

export function formatDateTimeLocalInput(date: Date | null): string {
  if (date === null) {
    return '';
  }

  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
