import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { ActionResult } from '../types/result';
import { ImageUploadField } from './ImageUploadField';

function makeFile(type = 'image/png', size = 1024, name = 'logo.png'): File {
  return new File([new Uint8Array(size)], name, { type });
}

function Harness({
  onUpload,
  initial = '',
}: {
  onUpload: (file: File) => Promise<ActionResult<{ url: string }>>;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <FoundlyThemeProvider>
      <ImageUploadField
        label="Logo"
        preview="circle"
        value={value}
        onChange={setValue}
        onUpload={onUpload}
      />
    </FoundlyThemeProvider>
  );
}

describe('ImageUploadField (feature 021)', () => {
  it('renders the upload control and the URL fallback', () => {
    render(
      <FoundlyThemeProvider>
        <ImageUploadField
          label="Logo"
          value=""
          onChange={vi.fn()}
          onUpload={vi.fn(async () => ({ ok: true as const, data: { url: 'x' } }))}
        />
      </FoundlyThemeProvider>,
    );

    expect(screen.getByLabelText('Subir Logo')).toBeInTheDocument();
    expect(screen.getByLabelText('Logo (URL)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subir imagen' })).toBeInTheDocument();
  });

  it('uploads a valid file, shows the preview and emits the resulting URL', async () => {
    const onUpload = vi.fn(
      async (): Promise<ActionResult<{ url: string }>> => ({
        ok: true,
        data: { url: 'https://cdn.test/logo.png' },
      }),
    );
    render(<Harness onUpload={onUpload} />);

    fireEvent.change(screen.getByLabelText('Subir Logo'), {
      target: { files: [makeFile()] },
    });

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    const preview = await screen.findByAltText('Vista previa de Logo');
    expect(preview).toHaveAttribute('src', 'https://cdn.test/logo.png');
    expect(screen.getByLabelText('Logo (URL)')).toHaveValue('https://cdn.test/logo.png');
  });

  it('rejects an unsupported format before uploading', async () => {
    const onUpload = vi.fn();
    render(<Harness onUpload={onUpload} />);

    fireEvent.change(screen.getByLabelText('Subir Logo'), {
      target: { files: [makeFile('image/gif', 10, 'a.gif')] },
    });

    expect(await screen.findByText('Formato no admitido. Usa PNG, JPG o WEBP.')).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('rejects an oversized file before uploading', async () => {
    const onUpload = vi.fn();
    render(<Harness onUpload={onUpload} />);

    fireEvent.change(screen.getByLabelText('Subir Logo'), {
      target: { files: [makeFile('image/png', 6 * 1024 * 1024)] },
    });

    expect(await screen.findByText('La imagen supera el máximo de 5 MB.')).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('keeps the previous value and surfaces a friendly error when upload fails', async () => {
    const onUpload = vi.fn(
      async (): Promise<ActionResult<{ url: string }>> => ({
        ok: false,
        error: { code: 'STATE_ERROR', message: 'No se pudo subir la imagen. Inténtalo de nuevo.' },
      }),
    );
    render(<Harness onUpload={onUpload} initial="https://old.test/logo.png" />);

    fireEvent.change(screen.getByLabelText('Subir Logo'), {
      target: { files: [makeFile()] },
    });

    expect(
      await screen.findByText('No se pudo subir la imagen. Inténtalo de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Logo (URL)')).toHaveValue('https://old.test/logo.png');
  });

  it('lets the operator paste a URL as the manual alternative', () => {
    const onChange = vi.fn();
    render(
      <FoundlyThemeProvider>
        <ImageUploadField label="Portada" urlLabel="URL de la portada" value="" onChange={onChange} onUpload={vi.fn()} />
      </FoundlyThemeProvider>,
    );

    fireEvent.change(screen.getByLabelText('URL de la portada'), {
      target: { value: 'https://cdn.test/paste.png' },
    });

    expect(onChange).toHaveBeenCalledWith('https://cdn.test/paste.png');
  });

  it('has no critical accessibility violations', async () => {
    const { container } = render(<Harness onUpload={vi.fn()} initial="https://cdn.test/logo.png" />);
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toHaveLength(0);
  });
});
