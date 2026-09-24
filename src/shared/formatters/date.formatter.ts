const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
});

const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
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

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}
