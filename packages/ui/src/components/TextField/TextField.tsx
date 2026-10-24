import MuiTextField from '@mui/material/TextField';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ChangeEvent, ReactNode } from 'react';

export interface TextFieldProps {
  label?: string;
  helperText?: string;
  error?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  name?: string;
  required?: boolean;
  fullWidth?: boolean;
  /** Renders a MUI `multiline` textarea (e.g. biographies). */
  multiline?: boolean;
  /** Number of visible rows when `multiline` is set. */
  rows?: number;
  /** Max length enforced by the native `inputProps.maxLength`. */
  maxLength?: number;
  /** Extra styles merged over the material TextField root (e.g. layout sizing). */
  sx?: SxProps<Theme>;
  /** Optional trailing adornment rendered inside the input (e.g. password visibility toggle). */
  endAdornment?: ReactNode;
}

export function TextField({
  label,
  helperText,
  error = false,
  value,
  onChange,
  disabled = false,
  placeholder,
  type = 'text',
  name,
  required = false,
  fullWidth = false,
  multiline = false,
  rows,
  maxLength,
  sx,
  endAdornment,
}: TextFieldProps) {
  return (
    <MuiTextField
      label={label}
      helperText={helperText}
      error={error}
      value={value}
      onChange={
        onChange
          ? (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)
          : undefined
      }
      disabled={disabled}
      placeholder={placeholder}
      type={type}
      name={name}
      required={required}
      fullWidth={fullWidth}
      variant="outlined"
      multiline={multiline}
      rows={rows}
      inputProps={maxLength ? { maxLength } : undefined}
      slotProps={endAdornment ? { input: { endAdornment } } : undefined}
      sx={sx}
    />
  );
}