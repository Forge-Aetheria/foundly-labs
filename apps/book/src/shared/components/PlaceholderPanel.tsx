'use client';

import { Card, Stack, Typography } from '@foundly/ui';

export interface PlaceholderPanelProps {
  title: string;
  description: string;
}

/** Non-core section placeholder; kept in the design system's visual language. */
export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <Card
      header={
        <Stack spacing={0.5}>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      }
    >
      <Typography variant="body2" color="text.secondary">
        Esta sección estará disponible en una próxima versión del panel.
      </Typography>
    </Card>
  );
}
