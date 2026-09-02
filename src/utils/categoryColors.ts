import { colors } from '../theme';

export type CategoryKind = 'energy' | 'hydration' | 'recovery' | 'supplement' | 'default';

/** Resuelve la línea de producto a partir del nombre de categoría (ES/EN). */
export function getCategoryKind(name?: string): CategoryKind {
  const normalized = (name || '').toLowerCase();

  if (
    normalized.includes('energy') ||
    normalized.includes('energ') ||
    normalized.includes('energía')
  ) {
    return 'energy';
  }
  if (
    normalized.includes('hydration') ||
    normalized.includes('hidrat') ||
    normalized.includes('hydro')
  ) {
    return 'hydration';
  }
  if (
    normalized.includes('recovery') ||
    normalized.includes('recuper') ||
    normalized.includes('rego')
  ) {
    return 'recovery';
  }
  if (
    normalized.includes('supplement') ||
    normalized.includes('suplement') ||
    normalized.includes('beta')
  ) {
    return 'supplement';
  }

  return 'default';
}

export function getCategoryColor(kind: CategoryKind): string {
  switch (kind) {
    case 'energy':
      return colors.categoryEnergy;
    case 'hydration':
      return colors.categoryHydration;
    case 'recovery':
      return colors.categoryRecovery;
    case 'supplement':
      return colors.categorySupplement;
    default:
      return colors.primary;
  }
}

export function getCategoryColorSoft(kind: CategoryKind): string {
  switch (kind) {
    case 'energy':
      return colors.categoryEnergySoft;
    case 'hydration':
      return colors.categoryHydrationSoft;
    case 'recovery':
      return colors.categoryRecoverySoft;
    case 'supplement':
      return colors.categorySupplementSoft;
    default:
      return colors.primarySoft;
  }
}

export function getCategoryColorsFromName(name?: string) {
  const kind = getCategoryKind(name);
  return {
    kind,
    color: getCategoryColor(kind),
    soft: getCategoryColorSoft(kind),
  };
}
