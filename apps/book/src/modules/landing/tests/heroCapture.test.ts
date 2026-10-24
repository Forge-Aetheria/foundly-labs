import { describe, expect, it } from 'vitest';
import { heroCaptureHref } from '../utils/heroCapture';

describe('heroCaptureHref', () => {
  it('redirects to the bare register entry when no email is provided', () => {
    expect(heroCaptureHref('')).toBe('/register');
    expect(heroCaptureHref('   ')).toBe('/register');
  });

  it('redirects to the bare register entry for an invalid email', () => {
    expect(heroCaptureHref('ana@')).toBe('/register');
    expect(heroCaptureHref('no-es-un-email')).toBe('/register');
    expect(heroCaptureHref('ana@dominio')).toBe('/register');
  });

  it('encodes and forwards a valid email to the register entry', () => {
    expect(heroCaptureHref('ana@negocio.dev')).toBe('/register?email=ana%40negocio.dev');
  });

  it('trims surrounding whitespace before validating', () => {
    expect(heroCaptureHref('  ana@negocio.dev  ')).toBe('/register?email=ana%40negocio.dev');
  });
});