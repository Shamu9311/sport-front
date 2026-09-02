/**
 * Design tokens — Sport-Funcional
 * Fuente única de verdad para colores, tipografía, espaciado y radios.
 *
 * Sistema visual estilo Science in Sport: fondo negro, cards oscuras,
 * acento rojo SiS, colores por categoría y tipografía blanca de alto contraste.
 * Se exportan paletas `light` y `dark`; la apariencia activa es DARK.
 */

/** Nombres de fuente registrados con useFonts (@expo-google-fonts/inter) en app/_layout.tsx */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Paleta LIGHT — alternativa para evaluación futura */
const light = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EFEFEC',

  border: '#E8E8E8',
  borderStrong: '#D9D9D6',
  divider: '#EEEEEB',

  primary: '#F0563C',
  primaryPressed: '#D6452C',
  primarySoft: 'rgba(240, 86, 60, 0.08)',
  /** Variante del acento para texto pequeño (contraste suficiente) */
  primaryText: '#D6452C',

  textPrimary: '#1C1C1C',
  textSecondary: '#6B6B6B',
  textMuted: '#9A9A9A',
  textOnPrimary: '#FFFFFF',

  success: '#2F9E60',
  info: '#2F80CB',
  error: '#D93B3B',
  warning: '#C97B1D',

  accent1: '#F0563C',
  accent2: '#2F9E60',
  accent3: '#2F80CB',
  accent4: '#C97B1D',

  categoryEnergy: '#F0563C',
  categoryEnergySoft: 'rgba(240, 86, 60, 0.12)',
  categoryHydration: '#2F80CB',
  categoryHydrationSoft: 'rgba(47, 128, 203, 0.12)',
  categoryRecovery: '#9B6DE8',
  categoryRecoverySoft: 'rgba(155, 109, 232, 0.12)',
  categorySupplement: '#2F9E60',
  categorySupplementSoft: 'rgba(47, 158, 96, 0.12)',

  overlay: 'rgba(20, 20, 20, 0.45)',
  overlayStrong: 'rgba(20, 20, 20, 0.65)',
  overlayLoading: 'rgba(247, 247, 245, 0.96)',

  tabInactive: '#8A8A8A',
  indicatorInactive: '#D8D8D4',

  shadow: '#1A1A1A',
} as const;

/** Paleta DARK — estilo Science in Sport (apariencia principal) */
const dark = {
  background: '#000000',
  surface: '#161616',
  surfaceElevated: '#1D1D1D',
  surfaceMuted: '#0D0D0D',

  border: '#2A2A2A',
  borderStrong: '#3A3A3A',
  divider: '#1F1F1F',

  primary: '#E8362D',
  primaryPressed: '#C22A22',
  primarySoft: 'rgba(232, 54, 45, 0.15)',
  /** Variante clara del rojo solo para texto pequeño sobre negro (mejor contraste) */
  primaryText: '#FF5A50',

  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#7A7A7A',
  textOnPrimary: '#FFFFFF',

  success: '#4CBB7F',
  info: '#5BA2E6',
  error: '#E05252',
  warning: '#E0A03E',

  accent1: '#E8362D',
  accent2: '#4CBB7F',
  accent3: '#5BA2E6',
  accent4: '#E0A03E',

  /** Líneas de producto SiS — código visual por categoría */
  categoryEnergy: '#E8362D',
  categoryEnergySoft: 'rgba(232, 54, 45, 0.15)',
  categoryHydration: '#3E9BE0',
  categoryHydrationSoft: 'rgba(62, 155, 224, 0.15)',
  categoryRecovery: '#9B6DE8',
  categoryRecoverySoft: 'rgba(155, 109, 232, 0.15)',
  categorySupplement: '#4CBB7F',
  categorySupplementSoft: 'rgba(76, 187, 127, 0.15)',

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayStrong: 'rgba(0, 0, 0, 0.8)',
  overlayLoading: 'rgba(0, 0, 0, 0.93)',

  tabInactive: '#8A8A8A',
  indicatorInactive: '#3A3A3A',

  shadow: '#000000',
} as const;

export const palettes = { light, dark } as const;

/** Paleta activa. La app usa el tema oscuro estilo SiS. */
export const colors = dark;

export const typography = {
  h1: { fontSize: 28, fontFamily: fontFamily.extrabold, color: colors.textPrimary },
  h2: { fontSize: 22, fontFamily: fontFamily.bold, color: colors.textPrimary },
  h3: { fontSize: 17, fontFamily: fontFamily.semibold, color: colors.textPrimary },
  body1: { fontSize: 15, fontFamily: fontFamily.regular, color: colors.textPrimary },
  body2: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary },
  caption: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary },
  overline: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  metric: { fontSize: 26, fontFamily: fontFamily.extrabold, color: colors.textPrimary },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPrimary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const theme = {
  colors,
  palettes,
  fontFamily,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;
