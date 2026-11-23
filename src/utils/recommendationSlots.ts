// Presentación de los huecos (fase + función) de Evidence RAG. La función interna es neutra
// (fueling, hydration, protein_support, caffeine, supplementation); la etiqueta visible depende de la fase.
import type {
  FunctionalRole,
  RecommendationTarget,
  RecommendationUsagePlan,
  SavedRecommendation,
} from '../types/UserTypes';

const PHASE_LABELS: Record<string, string> = {
  antes: 'Antes',
  durante: 'Durante',
  despues: 'Después',
  diario: 'Diario',
};

const ROLE_LABELS: Record<FunctionalRole, string> = {
  fueling: 'Combustible',
  hydration: 'Hidratación',
  protein_support: 'Proteína',
  caffeine: 'Cafeína',
  supplementation: 'Suplementación',
};

/** Etiqueta de la función según la fase (p. ej. después + protein_support → "Recuperación proteica"). */
export function roleLabel(role: FunctionalRole, timing?: string | null): string {
  if (timing === 'despues' && role === 'protein_support') return 'Recuperación proteica';
  if (timing === 'despues' && role === 'fueling') return 'Reposición de carbohidratos';
  return ROLE_LABELS[role] || role;
}

/** "Durante · Combustible", o solo la fase si la recomendación no tiene hueco (flujo anterior). */
export function slotLabel(timing?: string | null, role?: FunctionalRole | null): string {
  const phase = timing ? PHASE_LABELS[timing] || timing : 'Recomendado';
  return role ? `${phase} · ${roleLabel(role, timing)}` : phase;
}

const NUTRIENT_LABELS: Record<string, string> = {
  carbohydrate: 'carbohidrato',
  protein: 'proteína',
  sodium: 'sodio',
  caffeine: 'cafeína',
  creatine_monohydrate: 'creatina',
};

const fmt = (n?: number | null) => (n == null ? '…' : String(n).replace('.', ','));

/** "30–90 g/h de carbohidrato". */
export function targetText(target?: RecommendationTarget | null): string | null {
  if (!target || (target.min == null && target.max == null)) return null;
  const range = target.min != null && target.max != null && target.min !== target.max
    ? `${fmt(target.min)}–${fmt(target.max)}`
    : fmt(target.min ?? target.max);
  const unit = target.unit === 'g' ? 'g por toma' : target.unit || '';
  return `${range} ${unit} de ${NUTRIENT_LABELS[target.nutrient] || target.nutrient}`.replace(/\s+/g, ' ').trim();
}

/** Líneas del plan de uso calculado por el servidor (no las inventa el modelo). */
export function usagePlanLines(plan?: RecommendationUsagePlan | null): string[] {
  if (!plan) return [];
  const lines: string[] = [];
  if (plan.type === 'rate' && plan.servings_per_hour_min != null) {
    lines.push(
      `${fmt(plan.servings_per_hour_min)}–${fmt(plan.servings_per_hour_max)} porciones por hora` +
        (plan.interval_minutes_min && plan.interval_minutes_max
          ? ` (1 cada ~${plan.interval_minutes_min}–${plan.interval_minutes_max} min)`
          : '')
    );
    if (plan.repeat_same_product) lines.push('Puedes repetir el mismo producto durante toda la sesión.');
  }
  for (const inc of plan.includes || []) {
    lines.push(
      `${inc.product_name} aporta ${inc.carbohydrate_g} g que cuentan en este objetivo: sustituye ${fmt(inc.replaces_servings)} porción(es) (en lugar de, no además).`
    );
  }
  if (plan.replaces) {
    lines.push(
      `Sus ${plan.replaces.carbohydrate_g} g de carbohidrato cuentan en el objetivo: sustituye ${fmt(plan.replaces.servings)} porción(es) de ${plan.replaces.product_name}.`
    );
  }
  if (plan.caffeine) {
    const { mg_min, mg_max, mg_per_kg_min, mg_per_kg_max } = plan.caffeine;
    const mg = mg_min === mg_max ? `${mg_max} mg` : `${mg_min}–${mg_max} mg`;
    const perKg =
      mg_per_kg_max == null ? '' : mg_per_kg_min === mg_per_kg_max ? ` (≈${fmt(mg_per_kg_max)} mg/kg)` : ` (≈${fmt(mg_per_kg_min)}–${fmt(mg_per_kg_max)} mg/kg)`;
    lines.push(`Cafeína de todas las porciones: ${mg}${perKg}.`);
  }
  return lines;
}

/** Cafeína total de la sesión: suma de todas las porciones de todas las recomendaciones principales. */
export function sessionCaffeineText(recs: SavedRecommendation[] = []): string | null {
  const parts = recs.map((r) => r.usage_plan?.caffeine).filter(Boolean) as NonNullable<RecommendationUsagePlan['caffeine']>[];
  if (!parts.length) return null;
  const sum = (k: keyof (typeof parts)[number]) => Math.round(parts.reduce((t, p) => t + (Number(p[k]) || 0), 0) * 100) / 100;
  const mg = sum('mg_min') === sum('mg_max') ? `${sum('mg_max')} mg` : `${sum('mg_min')}–${sum('mg_max')} mg`;
  const kgMin = sum('mg_per_kg_min');
  const kgMax = sum('mg_per_kg_max');
  const perKg = kgMax ? (kgMin === kgMax ? ` (≈${fmt(kgMax)} mg/kg)` : ` (≈${fmt(kgMin)}–${fmt(kgMax)} mg/kg)`) : '';
  return `Cafeína total de la sesión: ${mg}${perKg}`;
}
