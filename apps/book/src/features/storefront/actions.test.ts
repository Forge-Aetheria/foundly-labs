import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, resetStore } from '../../server/store';
import { getPublicBusiness } from '../public-booking/queries';
import {
  addGalleryPhoto,
  createStaff,
  removeGalleryPhoto,
  removeStaff,
  setStaffActive,
  updatePolicies,
  updateProfile,
  updateStaff,
} from './actions';

describe('storefront gallery actions (006-gallery-management, TDD)', () => {
  it('adds a gallery photo with title and category, reflected on the public gallery', () => {
    const first = addGalleryPhoto({
      url: 'https://example.com/foto-1.jpg',
      title: 'Foto 1',
      category: 'local',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data.some((photo) => photo.url === 'https://example.com/foto-1.jpg')).toBe(true);
    const added = first.data.find((photo) => photo.url === 'https://example.com/foto-1.jpg');
    expect(added?.title).toBe('Foto 1');
    expect(added?.category).toBe('local');

    // Optional fields may be omitted.
    expect(addGalleryPhoto({ url: 'https://example.com/foto-2.jpg' }).ok).toBe(true);

    // Duplicate URLs are rejected (CONFLICT).
    expect(addGalleryPhoto({ url: 'https://example.com/foto-1.jpg' }).ok).toBe(false);

    const portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      const publicPhoto = portal.business.gallery?.find(
        (photo) => photo.url === 'https://example.com/foto-1.jpg',
      );
      expect(publicPhoto?.title).toBe('Foto 1');
      expect(publicPhoto?.category).toBe('Local');
    }
  });

  it('rejects invalid or missing URLs and unknown categories', () => {
    expect(addGalleryPhoto({ url: '' }).ok).toBe(false);
    expect(addGalleryPhoto({ url: 'no-es-una-url' }).ok).toBe(false);
    expect(addGalleryPhoto({ url: 'https://example.com', category: 'otro' }).ok).toBe(false);
  });

  it('removes a gallery photo by id and updates the public gallery', () => {
    const added = addGalleryPhoto({ url: 'https://example.com/foto-3.jpg' });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const photo = added.data.find((item) => item.url === 'https://example.com/foto-3.jpg');
    expect(photo).toBeDefined();

    const removed = removeGalleryPhoto({ id: photo!.id });
    expect(removed.ok).toBe(true);
    if (removed.ok) {
      expect(removed.data.some((item) => item.id === photo!.id)).toBe(false);
    }

    const portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      expect(portal.business.gallery?.some((item) => item.url === 'https://example.com/foto-3.jpg')).toBe(false);
    }
  });

  it('removeGalleryPhoto fails for an unknown id', () => {
    expect(removeGalleryPhoto({ id: 'no-existe' }).ok).toBe(false);
  });
});

describe('storefront actions (admin → public sync, 003 FR-016)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('requires an admin tenant session', () => {
    resetStore({ seed: false });
    expect(createStaff({ name: 'Nuria' }).ok).toBe(false);
    expect(updateProfile({ name: 'x', category: 'y' }).ok).toBe(false);
    expect(addGalleryPhoto({ url: 'https://x/img.png' }).ok).toBe(false);
  });

  it('creates, updates and toggles a professional shown on the public portal', () => {
    const created = createStaff({
      name: 'Nuria Pons',
      role: 'Colorista',
      bio: 'Color y balayage.',
      serviceIds: ['svc-corte'],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.active).toBe(true);
    expect(created.data.serviceIds).toEqual(['svc-corte']);

    const afterCreate = getPublicBusiness('estudio-ana');
    expect(afterCreate.status).toBe('available');
    if (afterCreate.status === 'available') {
      const specialist = afterCreate.business.specialists.find((s) => s.id === created.data.id);
      expect(specialist?.role).toBe('Colorista');
      expect(specialist?.services).toContain('Corte de cabello');
    }

    const updated = updateStaff({
      id: created.data.id,
      name: 'Nuria Pons',
      role: 'Estrilista',
      active: true,
      serviceIds: [],
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.data.serviceIds).toEqual([]);
    const afterUpdate = getPublicBusiness('estudio-ana');
    if (afterUpdate.status === 'available') {
      const specialist = afterUpdate.business.specialists.find((s) => s.id === created.data.id);
      expect(specialist?.services ?? []).toHaveLength(0);
    }

    const deactivated = setStaffActive({ id: created.data.id, active: false });
    expect(deactivated.ok).toBe(true);
    const afterToggle = getPublicBusiness('estudio-ana');
    if (afterToggle.status === 'available') {
      expect(afterToggle.business.specialists.some((s) => s.id === created.data.id)).toBe(false);
    }
  });

  it('removes a professional from the tenant roster', () => {
    const created = createStaff({ name: 'Temporal', role: null });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const removed = removeStaff({ id: created.data.id });
    expect(removed.ok).toBe(true);
    expect(getStore().resources.some((r) => r.id === created.data.id)).toBe(false);
  });

  it('updates the tenant profile surfaced by the public portal', () => {
    const result = updateProfile({
      name: 'Estudio Ana Beauty',
      category: 'Peluquería y estética',
      bio: 'Nueva bio.',
      address: 'Calle Mayor 7',
      phone: '+34 612 345 678',
      instagram: 'https://instagram.com/estudioanabeauty',
      whatsapp: '',
    });
    expect(result.ok).toBe(true);

    const portal = getPublicBusiness('estudio-ana');
    expect(portal.status).toBe('available');
    if (portal.status === 'available') {
      expect(portal.business.name).toBe('Estudio Ana Beauty');
      expect(portal.business.bio).toBe('Nueva bio.');
      expect(portal.business.social?.instagram).toBe('https://instagram.com/estudioanabeauty');
      expect(portal.business.social?.whatsapp).toBeUndefined();
    }
  });

  it('validates mandatory fields', () => {
    expect(createStaff({ name: '' }).ok).toBe(false);
    expect(updateProfile({ name: '', category: 'y' }).ok).toBe(false);
    // A service id outside the tenant catalog is rejected.
    expect(createStaff({ name: 'X', role: 'Y', serviceIds: ['svc-no-existe'] }).ok).toBe(false);
    expect(createStaff({ name: 'X', role: 'Y', serviceIds: ['svc-rona-1'] }).ok).toBe(false);
  });
});
describe('storefront profile actions (007-business-profile, TDD)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('validates and persists the public URL (slug)', () => {
    const renamed = updateProfile({
      name: 'Estudio Ana',
      category: 'Peluquería',
      slug: 'estudio-ana-nuevo',
    });
    expect(renamed.ok).toBe(true);

    const moved = getPublicBusiness('estudio-ana-nuevo');
    expect(moved.status).toBe('available');

    // Reserved and taken slugs are rejected without changes.
    expect(
      updateProfile({ name: 'Estudio Ana', category: 'Peluquería', slug: 'admin' }).ok,
    ).toBe(false);
    expect(
      updateProfile({ name: 'Estudio Ana', category: 'Peluquería', slug: 'rona-piercing' }).ok,
    ).toBe(false);

    // Reusing its own (already persisted) slug remains valid.
    expect(
      updateProfile({ name: 'Estudio Ana', category: 'Peluquería', slug: 'estudio-ana-nuevo' }).ok,
    ).toBe(true);
  });

  it('rejects a malformed Instagram link', () => {
    const result = updateProfile({
      name: 'Estudio Ana',
      category: 'Peluquería',
      instagram: 'no-es-una-url',
    });
    expect(result.ok).toBe(false);
  });

  it('replaces the tenant policies and reflects them on the public portal', () => {
    const result = updatePolicies([
      { title: 'Cancelación', body: 'Cancela gratis hasta 24 h antes.' },
      { title: 'Reagendar', body: 'Cambios sin coste.' },
    ]);
    expect(result.ok).toBe(true);

    let portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      expect(portal.business.policies.map((p) => p.title)).toEqual(['Cancelación', 'Reagendar']);
    }

    expect(updatePolicies([]).ok).toBe(true);
    portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      expect(portal.business.policies).toHaveLength(0);
    }
  });

  it('validates policy entries', () => {
    expect(updatePolicies([{ title: '', body: '' }]).ok).toBe(false);
  });
});
