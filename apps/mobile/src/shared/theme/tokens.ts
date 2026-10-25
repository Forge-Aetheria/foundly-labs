export const colors = {
  background: '#FAF8FF',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  overlay: 'rgba(250, 248, 255, 0.88)',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  primary: '#6C5CE7',
  primaryHover: '#5A4AD1',
  primarySoft: '#EEECFE',
  positive: '#10B981',
  positiveSoft: '#D1FAE5',
  negative: '#EF4444',
  negativeSoft: '#FEE2E2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const;

export const shadows = {
  card: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
} as const;
