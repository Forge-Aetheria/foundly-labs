import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  /** Forwarded to the native button (ARIA tabs/panels, ids for labelled-by). */
  id?: string;
  role?: string;
  'aria-selected'?: boolean;
  'aria-controls'?: string;
  /** Extra styles merged over the variant (e.g. landing glass button overrides). */
  sx?: SxProps<Theme>;
}

const VARIANT_PROPS = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined', color: 'inherit' },
  destructive: { variant: 'contained', color: 'error' },
} as const;

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  type = 'button',
  fullWidth = false,
  onClick,
  'aria-label': ariaLabel,
  id,
  role,
  'aria-selected': ariaSelected,
  'aria-controls': ariaControls,
  sx,
}: ButtonProps) {
  const { variant: muiVariant, color } = VARIANT_PROPS[variant];
  return (
    <MuiButton
      type={type}
      variant={muiVariant}
      color={color}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      aria-selected={ariaSelected}
      aria-controls={ariaControls}
      id={id}
      role={role}
      disableElevation
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      endIcon={endIcon}
      sx={sx}
    >
      {children}
    </MuiButton>
  );
}
