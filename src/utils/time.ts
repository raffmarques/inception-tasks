export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function parseTimeInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Try "2h 30m", "2h30m", "2h", "30m", or just a number (minutes)
  const match = trimmed.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i);
  if (match && (match[1] || match[2])) {
    const hours = parseInt(match[1] || '0', 10);
    const mins = parseInt(match[2] || '0', 10);
    return hours * 60 + mins;
  }

  // Plain number → minutes
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num > 0) return num;

  return undefined;
}
