import MuiCheckbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Optional labelled text; without it use `aria-label`. */
  label?: ReactNode;
  disabled?: boolean;
  name?: string;
  value?: string;
  'aria-label'?: string;
  /** Extra styles merged over the material Checkbox root. */
  sx?: SxProps<Theme>;
}

/** Checkbox control; optional `label` renders a MUI `FormControlLabel`. */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  name,
  value,
  'aria-label': ariaLabel,
  sx,
}: CheckboxProps) {
  const control = (
    <MuiCheckbox
      checked={checked}
      onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
      disabled={disabled}
      name={name}
      value={value}
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