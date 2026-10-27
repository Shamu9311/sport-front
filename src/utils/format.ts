/** Parsea YYYY-MM-DD como fecha local (evita desfase UTC). */
export function parseLocalDateString(dateString: string): Date {
  const raw = dateString.split('T')[0];
  const [y, m, d] = raw.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h} h ${min} min`;
  if (h > 0) return `${h} h`;
  return `${min} min`;
}

export function formatRelativeDate(dateString: string): string {
  const date = parseLocalDateString(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (86400000));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === -1) return 'Ayer';
  if (diffDays === 1) return 'Mañana';
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatLongDate(dateString: string): string {
  return parseLocalDateString(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function roundTimeTo5Min(date: Date): Date {
  const d = new Date(date);
  const mins = d.getMinutes();
  const rounded = Math.round(mins / 5) * 5;
  d.setMinutes(rounded, 0, 0);
  return d;
}

export function formatTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatStartTimeDisplay(time?: string | null): string {
  if (!time) return '--:--';
  return time.substring(0, 5);
}

/** Mapeo inverso aproximado intensidad DB -> UI */
export function intensityToUi(dbValue?: string): string {
  const map: Record<string, string> = {
    bajo: 'baja',
    medio: 'media',
    alto: 'alta',
    'muy alto': 'muy alta',
  };
  if (!dbValue) return 'media';
  return map[dbValue.toLowerCase()] || dbValue;
}

export function groupTrainingSessions<T extends { session_date: string }>(
  sessions: T[]
): { title: string; data: T[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  const day = weekStart.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diffToMonday);

  const thisWeek: T[] = [];
  const earlier: T[] = [];
  sessions.forEach((s) => {
    const d = parseLocalDateString(s.session_date);
    d.setHours(0, 0, 0, 0);
    if (d >= weekStart) thisWeek.push(s);
    else earlier.push(s);
  });
  const sections: { title: string; data: T[] }[] = [];
  if (thisWeek.length) sections.push({ title: 'Esta semana', data: thisWeek });
  if (earlier.length) sections.push({ title: 'Anteriores', data: earlier });
  return sections;
}

export function sportTypeToDefaultTrainingType(sport: string): string {
  const s = sport.toLowerCase();
  if (s.includes('ciclismo')) return 'cardio';
  if (s === 'natacion') return 'resistencia';
  if (s.includes('marathon') || s.includes('10k') || s.includes('15k') || s === 'trail') {
    return 'cardio';
  }
  if (s === 'triathlon') return 'mixed';
  return 'cardio';
}
