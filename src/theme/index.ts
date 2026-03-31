/**
 * Design tokens — Sport-Funcional
 * Fuente única de verdad para colores, tipografía, espaciado y radios.
 */

/** Nombres de fuente registrados con useFonts (@expo-google-fonts/inter) en app/_layout.tsx */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const colors = {
  background: '#181818',
  surface: '#242424',
  surfaceElevated: '#2C2C2C',
  surfaceMuted: '#1E1E1E',

  border: '#2E2E2E',
  borderStrong: '#3A3A3A',
  divider: '#2E2E2E',

  primary: '#C9A84C',
  primaryPressed: '#B8954A',

  textPrimary: '#F0F0F0',
  textSecondary: '#9A9A9A',
  textMuted: '#606060',
  textOnPrimary: '#181818',

  success: '#52A96B',
  info: '#4A90D9',
  error: '#E05252',
  warning: '#D4874A',

  /** Acentos secundarios unificados (iconos, chips) — tonos menos vivos */
  accent1: '#C9A84C',
  accent2: '#52A96B',
  accent3: '#4A90D9',
  accent4: '#D4874A',

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayStrong: 'rgba(0, 0, 0, 0.8)',
  overlayLoading: 'rgba(24, 24, 24, 0.95)',

  tabInactive: '#7A7A7A',
  indicatorInactive: '#4A4A4A',

  shadow: '#000000',
} as const;

export const typography = {
  h1: { fontSize: 26, fontFamily: fontFamily.bold, color: colors.primary },
  h2: { fontSize: 22, fontFamily: fontFamily.bold, color: colors.primary },
  h3: { fontSize: 18, fontFamily: fontFamily.semibold, color: colors.primary },
  body1: { fontSize: 16, fontFamily: fontFamily.regular, color: colors.textPrimary },
  body2: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary },
  caption: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary },
  overline: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export const theme = {
  colors,
  fontFamily,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;
