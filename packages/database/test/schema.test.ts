import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

function schema(): string {
  return readFileSync(schemaPath, 'utf8');
}

describe('@foundly/database schema (DB-First, 003-db-first-graphql-core)', () => {
  it('defines the seven booking entities and the specialist-service join', () => {
    const content = schema();
    for (const model of [
      'Tenant',
      'BusinessProfile',
      'Service',
      'Specialist',
      'Availability',
      'Appointment',
      'GalleryPhoto',
      'SpecialistService',
    ]) {
      expect(content, `model ${model} should exist`).toMatch(new RegExp(`^model ${model} `, 'm'));
    }
  });

  it('targets PostgreSQL with a DATABASE_URL datasource', () => {
    const content = schema();
    expect(content).toMatch(/provider\s*=\s*"postgresql"/);
    expect(content).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/);
  });

  it('keeps the public slug unique on BusinessProfile', () => {
    const content = schema();
    expect(content).toMatch(/model BusinessProfile \{[\s\S]*?slug\s+String\s+@unique/);
    expect(content).toMatch(/model Tenant \{[\s\S]*?\}/);
  });

  it('models the specialist-service assignment as a composite join', () => {
    const content = schema();
    expect(content).toMatch(
      /model SpecialistService \{[\s\S]*?@@id\(\[specialistId, serviceId\]\)/,
    );
  });

  it('stores an optional cancellation reason on appointments', () => {
    const content = schema();
    expect(content).toMatch(
      /model Appointment \{[\s\S]*?cancellationReason\s+String\?/,
    );
  });

  it('stores an optional plan on tenants (Foundly Pass entitlements)', () => {
    const content = schema();
    expect(content).toMatch(/model Tenant \{[\s\S]*?plan\s+String\?/);
  });
});
