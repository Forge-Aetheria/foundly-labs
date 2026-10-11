import MuiSwitch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Optional labelled text; without it use `aria-label`. */
  label?: ReactNode;
  disabled?: boolean;
  name?: string;
  'aria-label'?: string;
  /** Extra styles merged over the material Switch root. */
  sx?: SxProps<Theme>;
}

/** Switch control; optional `label` renders a MUI `FormControlLabel`. */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  name,
  'aria-label': ariaLabel,
  sx,
}: SwitchProps) {
  const control = (
    <MuiSwitch
      checked={checked}
      onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
      disabled={disabled}
      name={name}
      inputProps={{ 'aria-label': ariaLabel }}
      sx={sx}
    />
  );
  return label ? (
    <FormControlLabel control={control} label={label} disabled={disabled} />
  ) : (
    control
  );
}