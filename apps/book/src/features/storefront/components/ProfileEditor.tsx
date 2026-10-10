'use client';

import { useState } from 'react';
import { Badge, Button, Card, Stack, TextField, Typography } from '@foundly/ui';
import type { Tenant } from '../../../domain/tenancy/types';
import { updateProfile } from '../actions';

interface ProfileEditorProps {
  profile: Tenant;
}

interface ProfileDraft {
  name: string;
  category: string;
  bio: string;
  address: string;
  phone: string;
  avatar: string;
  cover: string;
  instagram: string;
  whatsapp: string;
}

function toDraft(profile: Tenant): ProfileDraft {
  return {
    name: profile.name,
    category: profile.category,
    bio: profile.bio ?? '',
    address: profile.address ?? '',
    phone: profile.phone ?? '',
    avatar: profile.avatar ?? '',
    cover: profile.cover ?? '',
    instagram: profile.social?.instagram ?? '',
    whatsapp: profile.social?.whatsapp ?? '',
  };
}

/** Perfil view: identity, logo, contact and social links shown on the public landing. */
export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(patchValue: Partial<ProfileDraft>) {
    setSaved(false);
    setDraft((prev) => ({ ...prev, ...patchValue }));
  }

  function save() {
    const result = updateProfile(draft);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setSaved(true);
  }

  return (
    <Card
      header={
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="h5" component="h1">
              Perfil y Acerca de
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Descripción, logo, contactos y redes que se muestran en la vista pública.
            </Typography>
          </Stack>
          <Button variant="primary" onClick={save}>
            Guardar perfil
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
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
          label="Bio / descripción"
          placeholder="Cuéntale a tus clientes qué hace tu negocio."
          value={draft.bio}
          onChange={(value) => patch({ bio: value })}
          fullWidth
        />

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

        <Typography variant="h6" component="h2">
          Logo e imagen de portada
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="Logo (URL)"
            placeholder="https://…"
            value={draft.avatar}
            onChange={(value) => patch({ avatar: value })}
            fullWidth
          />
          <TextField
            label="Portada (URL)"
            placeholder="https://…"
            value={draft.cover}
            onChange={(value) => patch({ cover: value })}
            fullWidth
          />
        </Stack>

        <Typography variant="h6" component="h2">
          Redes sociales
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="Instagram"
            placeholder="https://instagram.com/…"
            value={draft.instagram}
            onChange={(value) => patch({ instagram: value })}
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

        {error ? (
          <Typography variant="body2" color="error">
            {error}
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
  );
}