'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { Badge, Button, Card, Stack, TextField, Typography } from '@foundly/ui';
import {
  GLASS_CARD_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from '../../../app/components/landingCanon';
import type { BusinessHours, PortalPolicy, Tenant } from '../../../domain/tenancy/types';
import { WEEKDAY_LABELS } from '../../public-booking/format';
import { updatePolicies, updateProfile } from '../actions';

interface ProfileEditorProps {
  profile: Tenant;
  policies: PortalPolicy[];
}

interface ProfileDraft {
  name: string;
  category: string;
  slug: string;
  bio: string;
  address: string;
  phone: string;
  avatar: string;
  cover: string;
  instagram: string;
  whatsapp: string;
}

interface PolicyDraft {
  title: string;
  body: string;
}

function toDraft(profile: Tenant): ProfileDraft {
  return {
    name: profile.name,
    category: profile.category,
    slug: profile.slug,
    bio: profile.bio ?? '',
    address: profile.address ?? '',
    phone: profile.phone ?? '',
    avatar: profile.avatar ?? '',
    cover: profile.cover ?? '',
    instagram: profile.social?.instagram ?? '',
    whatsapp: profile.social?.whatsapp ?? '',
  };
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

/** Perfil y Acerca de: identity (incl. slug), contact, about, policies and hours (007). */
export function ProfileEditor({ profile, policies }: ProfileEditorProps) {
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile));
  const [policyRows, setPolicyRows] = useState<PolicyDraft[]>(() =>
    policies.map((policy) => ({ title: policy.title, body: policy.body })),
  );
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function patch(patchValue: Partial<ProfileDraft>) {
    setSaved(false);
    setDraft((prev) => ({ ...prev, ...patchValue }));
  }

  function updatePolicy(index: number, patchValue: Partial<PolicyDraft>) {
    setSaved(false);
    setPolicyRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patchValue } : row)));
  }

  function addPolicy() {
    setSaved(false);
    setPolicyRows((prev) => [...prev, { title: '', body: '' }]);
  }

  function removePolicy(index: number) {
    setSaved(false);
    setPolicyRows((prev) => prev.filter((_, idx) => idx !== index));
  }

  function save() {
    const result = updateProfile(draft);
    if (!result.ok) {
      setFieldErrors(result.error.fields ?? null);
      setFormError(result.error.fields?.slug ? null : result.error.message);
      return;
    }
    const policiesResult = updatePolicies(policyRows);
    if (!policiesResult.ok) {
      setFormError(policiesResult.error.message);
      return;
    }
    setFieldErrors(null);
    setFormError(null);
    setSaved(true);
  }

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
                Identidad, contacto, políticas y horario que se muestran en la vista pública.
              </Typography>
            </Stack>
            <Button variant="primary" sx={PRIMARY_BUTTON_SX} onClick={save}>
              Guardar perfil
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Identidad
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Nombre del negocio"
              value={draft.name}
              onChange={(value) => patch({ name: value })}
              fullWidth
            />
            <TextField
              label="Categoría"
              placeholder="P. ej. Peluquería"
              value={draft.category}
              onChange={(value) => patch({ category: value })}
              fullWidth
            />
          </Stack>
          <TextField
            label="URL pública"
            placeholder="ej. estudio-ana"
            value={draft.slug}
            onChange={(value) => patch({ slug: value })}
            error={Boolean(fieldErrors?.slug)}
            helperText={fieldErrors?.slug ?? 'Se mostrará en /book/<URL> para tus clientes.'}
            fullWidth
          />

          <Typography variant="h6" component="h2">
            Logo e imagen de portada
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <Stack spacing={1} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                label="Logo (URL)"
                placeholder="https://…"
                value={draft.avatar}
                onChange={(value) => patch({ avatar: value })}
                fullWidth
              />
              {draft.avatar.trim() ? (
                <Box
                  component="img"
                  src={draft.avatar.trim()}
                  alt="Vista previa del logo"
                  sx={{ height: 72, maxWidth: 220, objectFit: 'contain', borderRadius: 2 }}
                />
              ) : null}
            </Stack>
            <Stack spacing={1} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                label="Portada (URL)"
                placeholder="https://…"
                value={draft.cover}
                onChange={(value) => patch({ cover: value })}
                fullWidth
              />
              {draft.cover.trim() ? (
                <Box
                  component="img"
                  src={draft.cover.trim()}
                  alt="Vista previa de la portada"
                  sx={{ width: '100%', aspectRatio: '3 / 1', objectFit: 'cover', borderRadius: 2 }}
                />
              ) : null}
            </Stack>
          </Stack>

          <Typography variant="h6" component="h2">
            Contacto y redes
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Dirección"
              placeholder="Calle, número, ciudad"
              value={draft.address}
              onChange={(value) => patch({ address: value })}
              fullWidth
            />
            <TextField
              label="Teléfono"
              placeholder="+34 …"
              value={draft.phone}
              onChange={(value) => patch({ phone: value })}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Instagram"
              placeholder="https://instagram.com/…"
              value={draft.instagram}
              onChange={(value) => patch({ instagram: value })}
              error={Boolean(fieldErrors?.instagram)}
              helperText={fieldErrors?.instagram}
              fullWidth
            />
            <TextField
              label="WhatsApp"
              placeholder="https://wa.me/…"
              value={draft.whatsapp}
              onChange={(value) => patch({ whatsapp: value })}
              fullWidth
            />
          </Stack>

          <Typography variant="h6" component="h2">
            Acerca de
          </Typography>
          <TextField
            label="Bio / descripción"
            placeholder="Cuéntale a tus clientes qué hace tu negocio."
            value={draft.bio}
            onChange={(value) => patch({ bio: value })}
            multiline
            rows={3}
            maxLength={1000}
            helperText={`${draft.bio.length}/1000`}
            fullWidth
          />

          <Typography variant="h6" component="h2">
            Políticas de reserva y cancelación
          </Typography>
          {policyRows.length > 0 ? (
            <Stack spacing={1.5}>
              {policyRows.map((row, index) => (
                <Stack key={index} spacing={1} sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
                  <TextField
                    label={`Política ${index + 1} · Título`}
                    value={row.title}
                    onChange={(value) => updatePolicy(index, { title: value })}
                    fullWidth
                  />
                  <TextField
                    label={`Política ${index + 1} · Descripción`}
                    value={row.body}
                    onChange={(value) => updatePolicy(index, { body: value })}
                    multiline
                    rows={2}
                    maxLength={1000}
                    fullWidth
                  />
                  <Button variant="secondary" sx={SECONDARY_BUTTON_SX} onClick={() => removePolicy(index)}>
                    Quitar
                  </Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Todavía no hay políticas. Añade las condiciones de reserva y cancelación.
            </Typography>
          )}
          <Stack direction="row">
            <Button variant="secondary" sx={SECONDARY_BUTTON_SX} onClick={addPolicy}>
              + Añadir política
            </Button>
          </Stack>

          <Typography variant="h6" component="h2">
            Horario de atención
          </Typography>
          <Card sx={GLASS_CARD_SX}>
            <HoursSummary hours={profile.businessHours} />
          </Card>
          <Typography variant="caption" color="text.secondary">
            Resumen sincronizado con la configuración de disponibilidad.
          </Typography>

          {formError ? (
            <Typography variant="body2" color="error">
              {formError}
            </Typography>
          ) : null}

          <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="flex-end">
            {saved ? (
              <Badge pill status="positive">
                Guardado
              </Badge>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              Los cambios se reflejan al instante en la vista pública del negocio.
            </Typography>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}