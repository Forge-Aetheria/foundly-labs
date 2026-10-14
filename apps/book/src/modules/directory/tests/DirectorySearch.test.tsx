import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { DirectorySearch } from '../components/DirectorySearch';

const { replaceMock, refreshMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  usePathname: () => '/directorio',
}));

function renderSearch(value = '') {
  return render(
    <FoundlyThemeProvider>
      <DirectorySearch value={value} />
    </FoundlyThemeProvider>,
  );
}

describe('DirectorySearch (019)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('debounces typing into a single URL update', () => {
    vi.useFakeTimers();
    renderSearch();
    const input = screen.getByLabelText('Buscar negocios');
    fireEvent.change(input, { target: { value: 'corte' } });
    fireEvent.change(input, { target: { value: 'cortes' } });
    expect(replaceMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/directorio?q=cortes');
  });

  it('restores the base URL when the term is cleared', () => {
    vi.useFakeTimers();
    renderSearch('corte');
    const input = screen.getByLabelText('Buscar negocios');
    fireEvent.change(input, { target: { value: '' } });
    vi.advanceTimersByTime(300);
    expect(replaceMock).toHaveBeenCalledWith('/directorio');
  });

  it('keeps focus on the input while typing', () => {
    vi.useFakeTimers();
    renderSearch();
    const input = screen.getByLabelText('Buscar negocios');
    input.focus();
    fireEvent.change(input, { target: { value: 'ana' } });
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe('ana');
  });
});
