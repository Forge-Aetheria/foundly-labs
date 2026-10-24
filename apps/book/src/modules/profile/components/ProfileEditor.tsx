'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import MuiTextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { Button, Card, Stack, Switch, TextField, Typography } from '@foundly/ui';
import { TENANT_CATEGORIES, TENANT_CATEGORY_LABELS } from '@foundly/database/categories';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { ImageUploadField } from '../../../shared/components/ImageUploadField';
import { useToast } from '../../../shared/components/Toaster';
import type { Tenant } from '../../../shared/types/tenancy';
import { useUpdateProfile, useUploadProfileImage } from '../hooks';
import { AVATAR_RULE, COVER_RULE, checkImage, ruleGuidance } from '../utils/image-rules';
import { TagsInput } from './TagsInput';

export interface ProfileEditorProps {
  /** Profile read from the API; `null` when the tenant could not be resolved. */
  profile: Tenant | null;
  /** Backend/load error surfaced cleanly (no raw text). */
  error?: string | null;
  /** Renders the title as `h2` when embedded in the Configuración tabs. */
  embedded?: boolean;
}

/** Neutral, bordered card wrapper for a single media resource (feature 022 follow-up). */
const MEDIA_CARD_SX = {
  p: 2,
  border: '1px solid',
  borderColor: 'border.subtle',
  borderRadius: '16px',
  backgroundColor: 'surface.cardLight',
} as const;

interface PolicyDraft {
  title: string;
  body: string;
}

interface Draft {
  name: string;
  category: string;
  tags: string[];
  slug: string;
  logo: string;
  cover: string;
  address: string;
  phone: string;
  instagram: string;
  whatsapp: string;
  bio: string;
  isPublic: boolean;
  policies: PolicyDraft[];
}

function toDraft(profile: Tenant | null): Draft {
  return {
    name: profile?.name ?? '',
    category: profile?.category ?? '',
    tags: profile?.tags ?? [],
    slug: profile?.slug ?? '',
    logo: profile?.avatar ?? '',
    cover: profile?.cover ?? '',
    address: profile?.address ?? '',
    phone: profile?.phone ?? '',
    instagram: profile?.social?.instagram ?? '',
    whatsapp: profile?.social?.whatsapp ?? '',
    bio: profile?.bio ?? '',
    isPublic: profile?.isPublic ?? true,
    policies: (profile?.policies ?? []).map((policy) => ({
      title: policy.title,
      body: policy.body,
    })),
  };
}

/**
 * Perfil y Acerca de (feature 014): editable identity, contact, About and
 * reservation/cancellation policies, persisted through `useUpdateProfile`.
 * Media (logo/cover) lives in its own vertical card (feature 022 follow-up);
 * the weekly schedule is managed in `/admin/availability` and is not repeated here.
 */
export function ProfileEditor({ profile, error, embedded = false }: ProfileEditorProps) {
  const toast = useToast();
  const updateProfile = useUpdateProfile();
  const uploadLogo = useUploadProfileImage(profile?.id ?? '', 'logo');
  const uploadCover = useUploadProfileImage(profile?.id ?? '', 'cover');
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function patch(value: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...value }));
  }

  function patchPolicy(index: number, value: Partial<PolicyDraft>) {
    setDraft((prev) => ({
      ...prev,
      policies: prev.policies.map((policy, i) => (i === index ? { ...policy, ...value } : policy)),
    }));
  }

  function addPolicy() {
    setDraft((prev) => ({ ...prev, policies: [...prev.policies, { title: '', body: '' }] }));
  }

  function removePolicy(index: number) {
    setDraft((prev) => ({ ...prev, policies: prev.policies.filter((_, i) => i !== index) }));
  }

  async function save() {
    setSaving(true);
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
      tags: draft.tags,
      slug: draft.slug,
      bio: draft.bio,
      address: draft.address,
      phone: draft.phone,
      instagram: draft.instagram || null,
      whatsapp: draft.whatsapp || null,
      logo: draft.logo || null,
      cover: draft.cover || null,
      isPublic: draft.isPublic,
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
              <Typography variant="h5" component={embedded ? 'h2' : 'h1'}>
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
          <MuiTextField
            select
            label="Categoría"
            value={draft.category}
            onChange={(event) => patch({ category: event.target.value })}
            error={Boolean(fieldErrors?.category)}
            helperText={fieldErrors?.category}
            required
            fullWidth
          >
            {TENANT_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {TENANT_CATEGORY_LABELS[category]}
              </MenuItem>
            ))}
          </MuiTextField>
          <TagsInput
            value={draft.tags}
            onChange={(tags) => patch({ tags })}
            error={Boolean(fieldErrors?.tags)}
            helperText={fieldErrors?.tags}
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
          <Stack spacing={0.25}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack spacing={0.25}>
                <Typography variant="h6" component="h2">
                  Página pública
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cuando está activa, tus clientes pueden ver tu página y reservar online.
                </Typography>
              </Stack>
              <Switch
                checked={draft.isPublic}
                onChange={(checked) => patch({ isPublic: checked })}
                aria-label="Habilitar la página pública"
              />
            </Stack>
          </Stack>
          <Box sx={MEDIA_CARD_SX}>
            <Stack spacing={2}>
              <Stack spacing={0.25}>
                <Typography variant="h6" component="h2">
                  Logo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Imagen cuadrada (1:1) que acompaña al nombre del negocio.
                </Typography>
              </Stack>
              <ImageUploadField
                label="Logo"
                hideLabel
                layout="column"
                preview="square"
                value={draft.logo}
                onChange={(value) => patch({ logo: value })}
                onUpload={uploadLogo}
                error={Boolean(fieldErrors?.logo)}
                helperText={fieldErrors?.logo ?? ruleGuidance(AVATAR_RULE)}
              />
            </Stack>
          </Box>
          <Box sx={MEDIA_CARD_SX}>
            <Stack spacing={2}>
              <Stack spacing={0.25}>
                <Typography variant="h6" component="h2">
                  Portada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Banner (3:1) que encabeza tu página pública.
                </Typography>
              </Stack>
              <ImageUploadField
                label="Portada"
                hideLabel
                layout="column"
                preview="banner"
                value={draft.cover}
                onChange={(value) => patch({ cover: value })}
                onUpload={uploadCover}
                error={Boolean(fieldErrors?.cover)}
                helperText={fieldErrors?.cover ?? ruleGuidance(COVER_RULE)}
              />
            </Stack>
          </Box>

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
                <Stack
                  key={index}
                  spacing={1}
                  sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}
                >
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
        </Stack>
      </Card>
    </Stack>
  );
}
