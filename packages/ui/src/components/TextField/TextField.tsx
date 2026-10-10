import MuiTextField from '@mui/material/TextField';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ChangeEvent } from 'react';

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
  /** Extra styles merged over the material TextField root (e.g. layout sizing). */
  sx?: SxProps<Theme>;
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
  sx,
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
      sx={sx}
    />
  );
}