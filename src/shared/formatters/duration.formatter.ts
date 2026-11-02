export function formatDurationMinutes(durationInMinutes: number | null): string {
  if (durationInMinutes === null) {
    return 'Não informada';
  }

  const days = Math.floor(durationInMinutes / 1440);
  const hours = Math.floor((durationInMinutes % 1440) / 60);
  const minutes = durationInMinutes % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(days === 1 ? '1 dia' : `${days} dias`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}min`);
  }

  return parts.join(' ');
}
