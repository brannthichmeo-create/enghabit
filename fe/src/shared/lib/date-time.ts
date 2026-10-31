export function formatTime(value: Date | string, locale?: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

export function formatDateTime(value: Date | string, locale?: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}
