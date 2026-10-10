import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, resetStore } from '../../server/store';
import { getPublicBusiness } from '../public-booking/queries';
import {
  addGalleryImage,
  createStaff,
  removeGalleryImage,
  removeStaff,
  setStaffActive,
  updateProfile,
  updateStaff,
} from './actions';

describe('storefront actions (admin → public sync, 003 FR-016)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('requires an admin tenant session', () => {
    resetStore({ seed: false });
    expect(createStaff({ name: 'Nuria' }).ok).toBe(false);
    expect(updateProfile({ name: 'x', category: 'y' }).ok).toBe(false);
    expect(addGalleryImage({ url: 'https://x/img.png' }).ok).toBe(false);
  });

  it('creates, updates and toggles a professional shown on the public portal', () => {
    const created = createStaff({ name: 'Nuria Pons', role: 'Colorista', bio: 'Color y balayage.' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.active).toBe(true);

    const afterCreate = getPublicBusiness('estudio-ana');
    expect(afterCreate.status).toBe('available');
    if (afterCreate.status === 'available') {
      expect(afterCreate.business.specialists.some((s) => s.id === created.data.id)).toBe(true);
      expect(afterCreate.business.specialists.find((s) => s.id === created.data.id)?.role).toBe(
        'Colorista',
      );
    }

    const updated = updateStaff({ id: created.data.id, name: 'Nuria Pons', role: 'Estrilista', active: true });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.data.role).toBe('Estrilista');

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

  it('adds and removes gallery images shown in the public gallery', () => {
    const first = addGalleryImage({ url: 'https://example.com/foto-1.jpg' });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data).toContain('https://example.com/foto-1.jpg');

    // Duplicate URLs are rejected.
    expect(addGalleryImage({ url: 'https://example.com/foto-1.jpg' }).ok).toBe(false);

    const portal = getPublicBusiness('estudio-ana');
    if (portal.status === 'available') {
      expect(portal.business.gallery).toContain('https://example.com/foto-1.jpg');
    }

    const removed = removeGalleryImage({ url: 'https://example.com/foto-1.jpg' });
    expect(removed.ok).toBe(true);
    if (removed.ok) expect(removed.data).not.toContain('https://example.com/foto-1.jpg');
  });

  it('validates mandatory fields', () => {
    expect(createStaff({ name: '' }).ok).toBe(false);
    expect(updateProfile({ name: '', category: 'y' }).ok).toBe(false);
    expect(addGalleryImage({ url: '' }).ok).toBe(false);
  });
});