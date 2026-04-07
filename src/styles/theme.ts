export const theme = {
  colors: {
    bg: '#1D2633',
    blockBg: '#2C384A',
    brandGreen: '#10B981',
    brandPurple: '#9D4EDD',
    brandBlue: '#4CC2D7',
    textPrimary: '#FFFFFF',
    textSecondary: '#AEBBBA',
    innerCard: 'rgba(255, 255, 255, 0.1)',
  },
  borderRadius: '12px',
} as const

export type AppTheme = typeof theme
