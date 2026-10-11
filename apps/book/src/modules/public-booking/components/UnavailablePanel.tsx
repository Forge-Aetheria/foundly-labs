'use client';

import { Card, Container, Typography } from '@foundly/ui';

export interface UnavailablePanelProps {
  message: string;
}

/** Public "not available" state for unknown/draft/suspended tenants (FR-017). */
export function UnavailablePanel({ message }: UnavailablePanelProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card
        header={
          <Typography variant="h5" component="h1">
            No disponible
          </Typography>
        }
      >
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Card>
    </Container>
  );
}
