import { describe, expect, it } from 'vitest';
import { accountSchema, businessSchema, setupSchema } from '../utils/schemas';

const validHours = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday === 0
    ? { weekday, isOpen: false, startTime: '', endTime: '' }
    : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
);

describe('onboarding schemas (contracts/onboarding.contract.md)', () => {
  describe('account step (FR-007)', () => {
    it('accepts a valid account', () => {
      const result = accountSchema.safeParse({
        fullName: 'Raúl Gómez',
        email: 'raul@acme.dev',
        password: 'secreto123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid email', () => {
      const result = accountSchema.safeParse({
        fullName: 'Raúl',
        email: 'no-es-email',
        password: 'secreto123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a weak password (< 8 chars, no letters or no numbers)', () => {
      expect(
        accountSchema.safeParse({ fullName: 'A', email: 'a@b.dev', password: 'abc' }).success,
      ).toBe(false);
      expect(
        accountSchema.safeParse({ fullName: 'A', email: 'a@b.dev', password: 'abcdefgh' }).success,
      ).toBe(false);
      expect(
        accountSchema.safeParse({ fullName: 'A', email: 'a@b.dev', password: '12345678' }).success,
      ).toBe(false);
    });
  });

  describe('business step (FR-008/FR-009)', () => {
    const base = { name: 'Estudio Nuevo', category: 'Estética' };

    it('accepts a valid business with a well-formed slug', () => {
      const result = businessSchema.safeParse({ ...base, slug: 'estudio-nuevo' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid slug format', () => {
      const result = businessSchema.safeParse({ ...base, slug: 'Mi Negocio' });
      expect(result.success).toBe(false);
    });

    it('rejects a reserved slug', () => {
      const result = businessSchema.safeParse({ ...base, slug: 'admin' });
      expect(result.success).toBe(false);
    });
  });

  describe('setup step (FR-010)', () => {
    it('accepts a valid setup', () => {
      const result = setupSchema.safeParse({
        defaultAppointmentDurationMinutes: 45,
        businessHours: validHours,
      });
      expect(result.success).toBe(true);
    });

    it('rejects a non-positive duration', () => {
      const result = setupSchema.safeParse({
        defaultAppointmentDurationMinutes: 0,
        businessHours: validHours,
      });
      expect(result.success).toBe(false);
    });

    it('rejects an open day whose endTime is not after startTime', () => {
      const bad = validHours.map((hours) =>
        hours.weekday === 1 ? { ...hours, startTime: '18:00', endTime: '09:00' } : hours,
      );
      const result = setupSchema.safeParse({
        defaultAppointmentDurationMinutes: 45,
        businessHours: bad,
      });
      expect(result.success).toBe(false);
    });
  });
});
