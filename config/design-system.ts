// Design system colors and configuration
export const colors = {
  primary: '#111827', // Dark slate
  secondary: '#4F46E5', // Indigo accent
  background: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const

export const themes = {
  light: {
    background: colors.background,
    surface: colors.card,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    border: colors.border,
    primary: colors.primary,
    secondary: colors.secondary,
  },
  dark: {
    background: colors.primary,
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    primary: colors.secondary,
    secondary: colors.primary,
  },
} as const
