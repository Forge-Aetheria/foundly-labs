import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

function schema(): string {
  return readFileSync(schemaPath, 'utf8');
}

describe('@foundly/database schema (DB-First, 002-persistence-graphql)', () => {
  it('defines the seven base domain models', () => {
    const content = schema();
    for (const model of [
      'Tenant',
      'Profile',
      'Service',
      'Staff',
      'Appointment',
      'Gallery',
      'Availability',
    ]) {
      expect(content, `model ${model} should exist`).toMatch(new RegExp(`^model ${model} `, 'm'));
    }
  });

  it('targets PostgreSQL with a DATABASE_URL datasource', () => {
    const content = schema();
    expect(content).toMatch(/provider\s*=\s*"postgresql"/);
    expect(content).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/);
  });

  it('keeps the Tenant slug unique', () => {
    const content = schema();
    expect(content).toMatch(/slug\s+String\s+@unique/);
  });
});
