import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Badge, Card, Stack, Typography } from '@foundly/ui';
import { OverrideSubscriptionButton } from './OverrideSubscriptionButton';
import type { ManagedBusinessView } from '../utils/types';

export interface ManagedBusinessesTableProps {
  businesses: ManagedBusinessView[];
}

const STATUS_LABELS: Record<ManagedBusinessView['status'], string> = {
  active: 'Activa',
  past_due: 'Pago pendiente',
  expired: 'Vencida',
  canceled: 'Cancelada',
};

function formatExpiry(expiresAt: string | null): string {
  return expiresAt ? expiresAt.slice(0, 10) : '—';
}

/** All businesses with their subscription state; each row offers an override action. */
export function ManagedBusinessesTable({ businesses }: ManagedBusinessesTableProps) {
  if (businesses.length === 0) {
    return (
      <Card>
        <Typography variant="h6" component="h2">
          Sin negocios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aún no hay negocios registrados en la plataforma.
        </Typography>
      </Card>
    );
  }

  return (
    <Card>
      <TableContainer>
        <Table aria-label="Negocios registrados">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businesses.map((business) => (
              <TableRow key={business.tenantId} hover>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {business.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {business.slug}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Badge pill status={business.plan === 'PRO' ? 'positive' : 'neutral'}>
                    {business.plan}
                  </Badge>
                </TableCell>
                <TableCell>{STATUS_LABELS[business.status]}</TableCell>
                <TableCell>{formatExpiry(business.expiresAt)}</TableCell>
                <TableCell align="right">
                  <OverrideSubscriptionButton business={business} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
