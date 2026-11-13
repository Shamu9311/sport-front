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

/**
 * Clima guardado en BD → chip del formulario. La app envía 'soleado' y el backend guarda 'calido';
 * sin esta traducción, al editar no se marcaba ningún chip y el valor se perdía al guardar.
 */
export function weatherToUi(dbValue?: string | null): string {
  const map: Record<string, string> = {
    calido: 'soleado',
    moderado: 'nublado',
    humedo: 'húmedo',
    fresco: 'fresco',
    frio: 'fresco',
    caliente: 'caluroso',
  };
  if (!dbValue) return 'soleado';
  const key = dbValue.toLowerCase();
  return map[key] || (Object.values(map).includes(key) ? key : 'soleado');
}

/**
 * Texto de "Cuándo consumir". Antes se armaba como "<Timing> del entrenamiento", lo que producía
 * "Durante del entrenamiento", "Despues" sin tilde o "Diario del entrenamiento".
 */
export function formatConsumptionWhen(
  timing?: string | null,
  timingMinutes?: number | null,
  intervalMinutes?: number | null
): string {
  const minutes = Number(timingMinutes) || 0;
  const interval = Number(intervalMinutes) || 0;
  switch ((timing || '').toLowerCase()) {
    case 'antes':
      return minutes ? `Antes del entrenamiento · ${minutes} min antes` : 'Antes del entrenamiento';
    case 'durante':
      return interval ? `Durante el entrenamiento · cada ${interval} min` : 'Durante el entrenamiento';
    case 'despues':
      return minutes ? `Después del entrenamiento · dentro de ${minutes} min` : 'Después del entrenamiento';
    case 'diario':
      return 'Uso diario';
    default:
      return '';
  }
}

/** Etiquetas legibles (con tildes) para valores que vienen sin acentos desde la BD. */
const DISPLAY_LABELS: Record<string, string> = {
  // categorías
  energia: 'Energía',
  hidratacion: 'Hidratación',
  recuperacion: 'Recuperación',
  vitaminas: 'Vitaminas',
  // atributos
  'con cafeina': 'Con cafeína',
  isotonico: 'Isotónico',
  'alto en proteina': 'Alto en proteína',
  'alto en carbohidrato': 'Alto en carbohidratos',
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
  'libre de gluten': 'Sin gluten',
  'libre de lactosa': 'Sin lactosa',
  'libre de trigo': 'Sin trigo',
  'libre de frutos secos': 'Sin frutos secos',
  'libre de soya': 'Sin soya',
  // deportes / tipos de entrenamiento
  '10k': '10K',
  '15k': '15K',
  'media marathon': 'Media maratón',
  marathon: 'Maratón',
  trail: 'Trail',
  triathlon: 'Triatlón',
  'ciclismo de ruta': 'Ciclismo de ruta',
  'ciclismo de montaña': 'Ciclismo de montaña',
  natacion: 'Natación',
  cardio: 'Cardio',
  fuerza: 'Fuerza',
  hiit: 'HIIT',
  resistencia: 'Resistencia',
  mixed: 'Mixto',
  otro: 'Otro',
  // perfil
  hombre: 'Masculino',
  mujer: 'Femenino',
  'prefiero no decir': 'Prefiero no decir',
  sedentario: 'Sedentario',
  moderado: 'Moderado',
  activo: 'Activo',
  'muy activo': 'Muy activo',
  'mejor rendimiento': 'Rendimiento',
  'perder peso': 'Perder peso',
  'ganar musculo': 'Ganar músculo',
  'por salud': 'Salud general',
  ocasional: 'Ocasional',
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  'muy alto': 'Muy alto',
};

/** Convierte un valor de BD en etiqueta legible; si no lo conoce, lo capitaliza. */
export function displayLabel(value?: string | null): string {
  if (!value) return '';
  const key = String(value).trim().toLowerCase();
  if (DISPLAY_LABELS[key]) return DISPLAY_LABELS[key];
  const text = String(value).trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Etiquetas del perfil que dependen del campo (p. ej. "no" en restricciones = "Ninguna"). */
export function profileValueLabel(field: string, value?: string | null): string {
  if (value === null || value === undefined || value === '') return 'Sin definir';
  if (field === 'dietary_restrictions' && value === 'no') return 'Ninguna';
  if (field === 'caffeine_tolerance') {
    return ({ no: 'No consumo', bajo: 'Baja', medio: 'Media', alto: 'Alta' } as Record<string, string>)[value] || displayLabel(value);
  }
  if (field === 'training_frequency' && value !== 'ocasional') return `${value} veces/sem`;
  return displayLabel(value);
}

/** Número legible: quita decimales innecesarios ("89.00" → "89", "0.10" → "0.1"). */
export function formatNumber(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return String(Math.round(n * 100) / 100);
}

/** Etiqueta legible del clima guardado en BD (para el detalle del entrenamiento). */
export function weatherLabel(dbValue?: string | null): string {
  const ui = weatherToUi(dbValue);
  return ui.charAt(0).toUpperCase() + ui.slice(1);
}

/**
 * Indica si el entrenamiento ya terminó (fecha + hora de inicio + duración en el pasado).
 * Se usa para pedir feedback ("¿Te funcionó?") solo después de entrenar.
 */
export function hasSessionEnded(
  session: { session_date: string; start_time?: string | null; duration_min?: number | null },
  now: Date = new Date()
): boolean {
  if (!session?.session_date) return false;
  const [y, m, d] = String(session.session_date).split('T')[0].split('-').map(Number);
  const [hh, mm] = String(session.start_time || '00:00').split(':').map(Number);
  const end = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  end.setMinutes(end.getMinutes() + (Number(session.duration_min) || 0));
  return end.getTime() <= now.getTime();
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
