'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Paper from '@mui/material/Paper';
import { Stack, Typography } from '@foundly/ui';
import type { SubscriptionPlanView } from '../utils/types';

const FREE_BENEFITS = ['1 servicio activo', '1 miembro de equipo', 'Agenda y reservas básicas'];
const PRO_BENEFITS = [
  'Servicios ilimitados',
  'Equipo ilimitado',
  'Métricas y analíticas',
  'Reglas avanzadas de adelantos y notificaciones',
];

export function PlanBenefits({ effectivePlan }: { effectivePlan: SubscriptionPlanView }) {
  const benefits = effectivePlan === 'PRO' ? PRO_BENEFITS : FREE_BENEFITS;
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} variant="outlined">
      <Stack spacing={1.25}>
        <Typography variant="h6" component="h2">
          {effectivePlan === 'PRO' ? 'Tu plan Pro incluye' : 'Tu plan Free incluye'}
        </Typography>
        {benefits.map((benefit) => (
          <Stack key={benefit} direction="row" spacing={1} alignItems="center">
            <CheckCircleOutlineIcon color="primary" fontSize="small" aria-hidden="true" />
            <Typography variant="body2">{benefit}</Typography>
          </Stack>
        ))}
        {effectivePlan === 'FREE' ? (
          <Typography variant="body2" color="text.secondary">
            Mejora a Pro para desbloquear servicios y equipo ilimitados.
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
