'use client';

import Box from '@mui/material/Box';
import { Badge, Card, Stack, Typography } from '@foundly/ui';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import type { BusinessHours, PortalPolicy, Tenant } from '../../../shared/types/tenancy';
import { WEEKDAY_LABELS } from '../../../shared/utils/format';

export interface ProfileEditorProps {
  /** Profile read from the API; `null` when the tenant could not be resolved. */
  profile: Tenant | null;
  /** Policies have no backend counterpart yet — intentionally empty. */
  policies: PortalPolicy[];
  /** Backend/load error surfaced to the user (FR-010). */
  error?: string | null;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value && value.trim() ? value : '—'}
      </Typography>
    </Stack>
  );
}

function HoursSummary({ hours }: { hours: BusinessHours[] }) {
  return (
    <Stack spacing={0.5}>
      {WEEKDAY_LABELS.map((label, weekday) => {
        const day = hours.find((item) => item.weekday === weekday);
        const text = day?.isOpen ? `${day.startTime} – ${day.endTime}` : 'Cerrado';
        return (
          <Stack key={label} direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {text}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

/**
 * Perfil y Acerca de (feature 010 — T015, US5).
 * The identity/contact/about is read from the API; the API exposes no profile
 * mutation yet and policies have no backend, so this surface is read-only and
 * shows clean empty/unavailable states (never mocked data, FR-007).
 */
export function ProfileEditor({ profile, policies, error }: ProfileEditorProps) {
  return (
    <Stack spacing={3}>
      <Card
        header={
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.25}>
              <Typography variant="h5" component="h1">
                Perfil y Acerca de
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Identidad y contacto que se muestran en la vista pública.
              </Typography>
            </Stack>
            <Badge pill status="neutral">
              Solo lectura
            </Badge>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <ApiErrorDialog title="No se pudo cargar el perfil" message={error} />

          <Typography variant="h6" component="h2">
            Identidad
          </Typography>
          <Field label="Nombre del negocio" value={profile?.name ?? null} />
          <Field label="Categoría" value={profile?.category ?? null} />
          <Field label="URL pública" value={profile?.slug ? `/book/${profile.slug}` : null} />

          {profile?.avatar || profile?.cover ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              {profile?.avatar ? (
                <Box
                  component="img"
                  src={profile.avatar}
                  alt="Logo del negocio"
                  sx={{ height: 72, maxWidth: 220, objectFit: 'contain', borderRadius: 2 }}
                />
              ) : null}
              {profile?.cover ? (
                <Box
                  component="img"
                  src={profile.cover}
                  alt="Portada del negocio"
                  sx={{ width: { xs: '100%', sm: 260 }, aspectRatio: '3 / 1', objectFit: 'cover', borderRadius: 2 }}
                />
              ) : null}
            </Stack>
          ) : null}

          <Typography variant="h6" component="h2">
            Contacto y redes
          </Typography>
          <Field label="Dirección" value={profile?.address ?? null} />
          <Field label="Teléfono" value={profile?.phone ?? null} />
          <Field label="Instagram" value={profile?.social?.instagram ?? null} />
          <Field label="WhatsApp" value={profile?.social?.whatsapp ?? null} />

          <Typography variant="h6" component="h2">
            Acerca de
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile?.bio?.trim() ? profile.bio : 'Todavía no hay descripción.'}
          </Typography>

          <Typography variant="h6" component="h2">
            Políticas de reserva y cancelación
          </Typography>
          {policies.length > 0 ? (
            <Stack spacing={1}>
              {policies.map((policy) => (
                <Typography key={policy.id} variant="body2">
                  <strong>{policy.title}</strong> · {policy.body}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Todavía no hay políticas: esta sección aún no tiene soporte en el backend.
            </Typography>
          )}

          <Typography variant="h6" component="h2">
            Horario de atención
          </Typography>
          <Card sx={GLASS_CARD_SX}>
            {profile && profile.businessHours.length > 0 ? (
              <HoursSummary hours={profile.businessHours} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Horario no disponible todavía.
              </Typography>
            )}
          </Card>

          <Typography variant="caption" color="text.secondary">
            La edición del perfil aún no está disponible: el backend todavía no expone la
            actualización del negocio.
          </Typography>
        </Stack>
      </Card>
    </Stack>
  );
}