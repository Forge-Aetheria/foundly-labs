import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  TENANT_MEDIA_BUCKET,
  uploadImage,
  validateImageFile,
} from './uploadImage';

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock('../auth/supabase/client', () => ({
  createBrowserSupabaseClient: createClientMock,
}));

function makeFile(type = 'image/png', size = 1024, name = 'photo.png'): File {
  return new File([new Uint8Array(size)], name, { type });
}

function supabaseStub(error: { message: string } | null = null) {
  const upload = vi.fn(async () => ({ error }));
  const getPublicUrl = vi.fn((path: string) => ({
    data: { publicUrl: `https://cdn.test/${path}` },
  }));
  const from = vi.fn(() => ({ upload, getPublicUrl }));
  return { client: { storage: { from } }, upload, getPublicUrl, from };
}

describe('uploadImage (feature 021)', () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it('accepts PNG/JPG/WEBP sizes and rejects other formats', () => {
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/png');
    expect(validateImageFile(makeFile('image/png'))).toEqual({ ok: true });
    expect(validateImageFile(makeFile('image/jpeg', 10, 'a.jpg'))).toEqual({ ok: true });
    expect(validateImageFile(makeFile('image/webp', 10, 'a.webp'))).toEqual({ ok: true });
    const bad = validateImageFile(makeFile('image/gif', 10, 'a.gif'));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toMatch(/PNG, JPG o WEBP/);
  });

  it('rejects files over the 5 MB maximum', () => {
    const oversize = validateImageFile(makeFile('image/png', MAX_IMAGE_BYTES + 1));
    expect(oversize.ok).toBe(false);
    if (!oversize.ok) expect(oversize.message).toMatch(/5 MB/);
  });

  it('returns a validation error and never touches storage for a bad file', async () => {
    const stub = supabaseStub();
    createClientMock.mockReturnValue(stub.client);
    const result = await uploadImage(makeFile('image/gif', 10, 'a.gif'), {
      scope: 'ten-1',
      folder: 'logo',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(stub.from).not.toHaveBeenCalled();
  });

  it('returns STATE_ERROR when storage is not configured', async () => {
    createClientMock.mockReturnValue(null);
    const result = await uploadImage(makeFile(), { scope: 'ten-1', folder: 'logo' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('STATE_ERROR');
  });

  it('uploads to the tenant-media bucket under {scope}/{folder} and returns the public URL', async () => {
    const stub = supabaseStub();
    createClientMock.mockReturnValue(stub.client);

    const result = await uploadImage(makeFile('image/png'), { scope: 'ten-1', folder: 'cover' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.url).toMatch(/^https:\/\/cdn\.test\//);
    expect(stub.from).toHaveBeenCalledWith(TENANT_MEDIA_BUCKET);
    const [path, file, options] = stub.upload.mock.calls[0]! as unknown as [
      string,
      File,
      { contentType: string; upsert: boolean },
    ];
    expect(path).toMatch(/^ten-1\/cover\/.+\.png$/);
    expect(options).toEqual({ contentType: 'image/png', upsert: false });
    expect(file.type).toBe('image/png');
  });

  it('omits the folder when none is provided (payment-proof shape)', async () => {
    const stub = supabaseStub();
    createClientMock.mockReturnValue(stub.client);

    await uploadImage(makeFile('image/jpeg', 10, 'proof.jpg'), {
      bucket: 'payment-proofs',
      scope: 'estudio-ana',
    });

    expect(stub.from).toHaveBeenCalledWith('payment-proofs');
    const [path] = stub.upload.mock.calls[0]! as unknown as [string];
    expect(path).toMatch(/^estudio-ana\/.+\.jpg$/);
  });

  it('returns STATE_ERROR when the storage upload fails', async () => {
    const stub = supabaseStub({ message: 'boom' });
    createClientMock.mockReturnValue(stub.client);

    const result = await uploadImage(makeFile(), { scope: 'ten-1', folder: 'gallery' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('STATE_ERROR');
  });
});
