import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import { RADIUS } from '../../theme';

export type BadgeStatus = 'positive' | 'negative' | 'warning' | 'info' | 'neutral';

/**
 * Palette token paths resolved by the theme at style time (FR-002).
 * Strings (not functions) keep Badge serializable across the RSC boundary
 * when rendered from a Server Component.
 */
const STATUS_TONES = {
  positive: { backgroundColor: 'success.light', color: 'success.main' },
  negative: { backgroundColor: 'error.light', color: 'error.main' },
  warning: { backgroundColor: 'warning.light', color: 'warning.main' },
  info: { backgroundColor: 'info.light', color: 'info.main' },
  neutral: { backgroundColor: 'surface.badgePill', color: 'text.secondary' },
} as const;

export interface BadgeProps {
  children: ReactNode;
  status?: BadgeStatus;
  pill?: boolean;
  icon?: ReactNode;
}

export function Badge({ children, status = 'neutral', pill = false, icon }: BadgeProps) {
  return (
    <Box
      component="span"
      sx={{
        ...STATUS_TONES[status],
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.25,
        py: 0.25,
        borderRadius: pill ? `${RADIUS.pill}px` : `${RADIUS.control}px`,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.6,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </Box>
  );
}
