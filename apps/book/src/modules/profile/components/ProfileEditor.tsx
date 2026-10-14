'use client';

import { useState } from 'react';
import { Badge, Button, Card, Stack, TextField, Typography } from '@foundly/ui';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { ImageUploadField } from '../../../shared/components/ImageUploadField';
import { useToast } from '../../../shared/components/Toaster';
import { WEEKDAY_LABELS } from '../../../shared/utils/format';
import type { BusinessHours, Tenant } from '../../../shared/types/tenancy';
import { useUpdateProfile, useUploadProfileImage } from '../hooks';
import { AVATAR_RULE, COVER_RULE, checkImage, ruleGuidance } from '../utils/image-rules';

export interface ProfileEditorProps {
  /** Profile read from the API; `null` when the tenant could not be resolved. */
  profile: Tenant | null;
  /** Backend/load error surfaced cleanly (no raw text). */
  error?: string | null;
}

interface PolicyDraft {
  title: string;
  body: string;
}

interface Draft {
  name: string;
  category: string;
  slug: string;
  logo: string;
  cover: string;
  address: string;
  phone: string;
  instagram: string;
  whatsapp: string;
  bio: string;
  policies: PolicyDraft[];
}

function toDraft(profile: Tenant | null): Draft {
  return {
    name: profile?.name ?? '',
    category: profile?.category ?? '',
    slug: profile?.slug ?? '',
    logo: profile?.avatar ?? '',
    cover: profile?.cover ?? '',
    address: profile?.address ?? '',
    phone: profile?.phone ?? '',
    instagram: profile?.social?.instagram ?? '',
    whatsapp: profile?.social?.whatsapp ?? '',
    bio: profile?.bio ?? '',
    policies: (profile?.policies ?? []).map((policy) => ({ title: policy.title, body: policy.body })),
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

/**
 * Perfil y Acerca de (feature 014): editable identity, contact, About and
 * reservation/cancellation policies, persisted through `useUpdateProfile`.
 */
export function ProfileEditor({ profile, error }: ProfileEditorProps) {
  const toast = useToast();
  const updateProfile = useUpdateProfile();
  const uploadLogo = useUploadProfileImage(profile?.id ?? '', 'logo');
  const uploadCover = useUploadProfileImage(profile?.id ?? '', 'cover');
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function patch(value: Partial<Draft>) {
    setSaved(false);
    setDraft((prev) => ({ ...prev, ...value }));
  }

  function patchPolicy(index: number, value: Partial<PolicyDraft>) {
    setSaved(false);
    setDraft((prev) => ({
      ...prev,
      policies: prev.policies.map((policy, i) => (i === index ? { ...policy, ...value } : policy)),
    }));
  }

  function addPolicy() {
    setSaved(false);
    setDraft((prev) => ({ ...prev, policies: [...prev.policies, { title: '', body: '' }] }));
  }

  function removePolicy(index: number) {
    setSaved(false);
    setDraft((prev) => ({ ...prev, policies: prev.policies.filter((_, i) => i !== index) }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setFieldErrors(null);
    setActionNotice(null);

    const logoCheck = await checkImage(draft.logo, AVATAR_RULE);
    const coverCheck = await checkImage(draft.cover, COVER_RULE);
    if (!logoCheck.ok || !coverCheck.ok) {
      setSaving(false);
      setFieldErrors({
        ...(logoCheck.ok ? {} : { logo: logoCheck.message }),
        ...(coverCheck.ok ? {} : { cover: coverCheck.message }),
      });
      return;
    }

    const result = await updateProfile({
      name: draft.name,
      category: draft.category,
      slug: draft.slug,
      bio: draft.bio,
      address: draft.address,
      phone: draft.phone,
      instagram: draft.instagram || null,
      whatsapp: draft.whatsapp || null,
      logo: draft.logo || null,
      cover: draft.cover || null,
      policies: draft.policies,
    });
    setSaving(false);
    if (!result.ok) {
      if (result.error.fields) {
        setFieldErrors(result.error.fields);
      } else {
        setActionNotice(result.error.message);
      }
      return;
    }
    setDraft(toDraft(result.data));
    setSaved(true);
    toast.success('Perfil guardado.');
  }

  return (
    <Stack spacing={3}>
      <ApiErrorDialog title="No se pudo cargar el perfil" message={error} />
      <ApiErrorDialog title="No se pudo guardar el perfil" message={actionNotice} />

      <Card
        header={
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.25}>
              <Typography variant="h5" component="h1">
                Perfil y Acerca de
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Identidad, contacto y políticas que se muestran en la vista pública.
              </Typography>
            </Stack>
            <Button variant="primary" onClick={save} disabled={saving || !profile}>
              {saving ? 'Guardando…' : 'Guardar perfil'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Identidad
          </Typography>
          <TextField
            label="Nombre del negocio"
            value={draft.name}
            onChange={(value) => patch({ name: value })}
            error={Boolean(fieldErrors?.name)}
            helperText={fieldErrors?.name}
            required
            fullWidth
          />
          <TextField
            label="Categoría"
            value={draft.category}
            onChange={(value) => patch({ category: value })}
            error={Boolean(fieldErrors?.category)}
            helperText={fieldErrors?.category}
            required
            fullWidth
          />
          <TextField
            label="URL pública (slug)"
            value={draft.slug}
            onChange={(value) => patch({ slug: value })}
            error={Boolean(fieldErrors?.slug)}
            helperText={fieldErrors?.slug}
            required
            fullWidth
          />
          <ImageUploadField
            label="Logo"
            preview="circle"
            value={draft.logo}
            onChange={(value) => patch({ logo: value })}
            onUpload={uploadLogo}
            error={Boolean(fieldErrors?.logo)}
            helperText={fieldErrors?.logo ?? ruleGuidance(AVATAR_RULE)}
          />
          <ImageUploadField
            label="Portada"
            preview="banner"
            value={draft.cover}
            onChange={(value) => patch({ cover: value })}
            onUpload={uploadCover}
            error={Boolean(fieldErrors?.cover)}
            helperText={fieldErrors?.cover ?? ruleGuidance(COVER_RULE)}
          />

          <Typography variant="h6" component="h2">
            Contacto y redes
          </Typography>
          <TextField
            label="Dirección"
            value={draft.address}
            onChange={(value) => patch({ address: value })}
            fullWidth
          />
          <TextField
            label="Teléfono"
            value={draft.phone}
            onChange={(value) => patch({ phone: value })}
            fullWidth
          />
          <TextField
            label="Instagram (URL)"
            placeholder="https://instagram.com/…"
            value={draft.instagram}
            onChange={(value) => patch({ instagram: value })}
            error={Boolean(fieldErrors?.instagram)}
            helperText={fieldErrors?.instagram}
            fullWidth
          />
          <TextField
            label="WhatsApp (URL)"
            placeholder="https://wa.me/…"
            value={draft.whatsapp}
            onChange={(value) => patch({ whatsapp: value })}
            error={Boolean(fieldErrors?.whatsapp)}
            helperText={fieldErrors?.whatsapp}
            fullWidth
          />

          <Typography variant="h6" component="h2">
            Acerca de
          </Typography>
          <TextField
            label="Descripción"
            value={draft.bio}
            onChange={(value) => patch({ bio: value })}
            error={Boolean(fieldErrors?.bio)}
            helperText={fieldErrors?.bio}
            multiline
            rows={4}
            maxLength={2000}
            fullWidth
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="h2">
              Políticas de reserva y cancelación
            </Typography>
            <Button variant="secondary" onClick={addPolicy}>
              + Añadir política
            </Button>
          </Stack>
          {draft.policies.length > 0 ? (
            <Stack spacing={1.5}>
              {draft.policies.map((policy, index) => (
                <Stack key={index} spacing={1} sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
                  <TextField
                    label={`Título · política ${index + 1}`}
                    value={policy.title}
                    onChange={(value) => patchPolicy(index, { title: value })}
                    fullWidth
                  />
                  <TextField
                    label="Contenido"
                    value={policy.body}
                    onChange={(value) => patchPolicy(index, { body: value })}
                    multiline
                    rows={2}
                    maxLength={2000}
                    fullWidth
                  />
                  <Stack direction="row" justifyContent="flex-end">
                    <Button variant="destructive" onClick={() => removePolicy(index)}>
                      Quitar política
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Todavía no hay políticas. Añade una con «+ Añadir política».
            </Typography>
          )}

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" component="h2">
              Horario de atención
            </Typography>
            {saved ? (
              <Badge pill status="positive">
                Guardado
              </Badge>
            ) : null}
          </Stack>
          <Card sx={GLASS_CARD_SX}>
            {profile && profile.businessHours.length > 0 ? (
              <HoursSummary hours={profile.businessHours} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                El resumen de horario se sincroniza con la sección Disponibilidad.
              </Typography>
            )}
          </Card>
        </Stack>
      </Card>
    </Stack>
  );
}
