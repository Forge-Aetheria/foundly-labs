import { describe, expect, it } from 'vitest';
import { mapMyService, mapMySpecialist, type MyServiceDto, type MySpecialistDto } from './remoteCatalog';

const serviceDto: MyServiceDto = {
  id: 'svc-1',
  name: 'Corte',
  description: null,
  priceCents: 2000,
  durationMinutes: 30,
  category: 'Peluquería',
  active: true,
};

const specialistDto: MySpecialistDto = {
  id: 'res-1',
  name: 'Ana',
  role: 'Peluquera senior',
  bio: null,
  avatar: 'https://example.com/a.png',
  active: true,
};

describe('remoteCatalog mappers (feature 008 — data-model §2/§3)', () => {
  it('maps MyService to a book Service + active Rate (price → rate)', () => {
    const { service, rate } = mapMyService(serviceDto, 'ten-ana');
    expect(service).toMatchObject({
      id: 'svc-1',
      name: 'Corte',
      description: null,
      durationMinutes: 30,
      category: 'Peluquería',
      active: true,
      tenantId: 'ten-ana',
    });
    expect(service.bufferMinutes).toBe(0); // local hold — not served by the API surface
    expect(rate).toMatchObject({
      serviceId: 'svc-1',
      amountCents: 2000,
      currency: 'EUR',
      effectiveTo: null,
    });
  });

  it('maps MySpecialist to a book professional Resource', () => {
    const resource = mapMySpecialist(specialistDto, 'ten-ana');
    expect(resource).toMatchObject({
      id: 'res-1',
      name: 'Ana',
      type: 'professional',
      role: 'Peluquera senior',
      avatar: 'https://example.com/a.png',
      bio: null,
      active: true,
      tenantId: 'ten-ana',
    });
  });
});