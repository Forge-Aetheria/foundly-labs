import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { foundlyTheme, RADIUS } from '../../theme';

export interface CardProps {
  children?: ReactNode;
  header?: ReactNode;
  media?: ReactNode;
  actions?: ReactNode;
  elevated?: boolean;
  /** Extra styles merged after the base surface (e.g. glassmorphism overrides). */
  sx?: SxProps<Theme>;
}

export function Card({ children, header, media, actions, elevated = false, sx }: CardProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          // Palette token paths + static theme values keep the base surface
          // serializable when Card is rendered from a Server Component.
          backgroundColor: 'surface.cardLight',
          border: '1px solid',
          borderColor: 'border.subtle',
          borderRadius: `${RADIUS.container}px`,
          boxShadow: elevated ? foundlyTheme.palette.shadow.fab : foundlyTheme.palette.shadow.card,
          overflow: 'hidden',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {media ? <Box>{media}</Box> : null}
      {header ? <Box sx={{ px: 3, pt: 3 }}>{header}</Box> : null}
      <Box sx={{ p: 3 }}>{children}</Box>
      {actions ? (
        <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {actions}
        </Box>
      ) : null}
    </Paper>
  );
}
