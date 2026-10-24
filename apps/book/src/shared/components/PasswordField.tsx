'use client';

import { useState } from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { TextField } from '@foundly/ui';

export interface PasswordFieldProps {
  label?: string;
  name?: string;
  required?: boolean;
  fullWidth?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
}

/** Password input with an integrated visibility toggle (Eye / EyeOff). */
export function PasswordField({
  label,
  name,
  required,
  fullWidth,
  value,
  onChange,
  error,
  helperText,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      name={name}
      type={visible ? 'text' : 'password'}
      required={required}
      fullWidth={fullWidth}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setVisible((prev) => !prev)}
            edge="end"
          >
            {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </InputAdornment>
      }
    />
  );
}