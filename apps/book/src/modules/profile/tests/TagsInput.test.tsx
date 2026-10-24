import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FoundlyThemeProvider } from '@foundly/ui';
import { TagsInput } from '../components/TagsInput';

function Harness() {
  const [tags, setTags] = useState<string[]>([]);
  return <TagsInput value={tags} onChange={setTags} />;
}

describe('TagsInput', () => {
  it('adds Title Case chips with Enter and comma and removes them', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <Harness />
      </FoundlyThemeProvider>,
    );

    const input = screen.getByLabelText('Etiquetas');
    await user.type(input, 'corte de PELO{Enter}');
    await user.type(input, 'color,');
    expect(screen.getByText('Corte De Pelo')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();

    await user.click(screen.getAllByTestId('CancelIcon')[0]!);
    expect(screen.queryByText('Corte De Pelo')).not.toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('ignores duplicate tags case-insensitively', async () => {
    const user = userEvent.setup();
    render(
      <FoundlyThemeProvider>
        <Harness />
      </FoundlyThemeProvider>,
    );
    const input = screen.getByLabelText('Etiquetas');
    await user.type(input, 'Color{Enter}');
    await user.type(input, 'color{Enter}');
    expect(screen.getAllByText('Color')).toHaveLength(1);
  });
});
