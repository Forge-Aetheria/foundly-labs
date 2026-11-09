import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TenantsService } from '../tenants/tenants.service';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import { OnboardingService } from './onboarding.service';

const { adminMock } = vi.hoisted(() => ({
  adminMock: {
    auth: {
      admin: {
        createUser: vi.fn(),
        getUserById: vi.fn(),
        updateUserById: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  },
}));

vi.mock('../../shared/supabase/admin-client', () => ({
  createSupabaseAdminClient: () => adminMock,
}));

const input = {
  account: { fullName: 'Raúl Gómez', email: 'raul@nuevo.dev', password: 'secreto123' },
  business: { name: 'Estudio Nuevo', category: 'SALUD_BIENESTAR', slug: 'estudio-nuevo' },
};

describe('OnboardingService (feature 024 — secure binding)', () => {
  const createTenant = vi.fn();
  const deleteTenant = vi.fn();
  let service: OnboardingService;

  beforeEach(() => {
    vi.clearAllMocks();
    createTenant.mockResolvedValue({ id: 'ten-1' });
    deleteTenant.mockResolvedValue({});
    adminMock.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    adminMock.auth.admin.getUserById.mockResolvedValue({
      data: { user: { app_metadata: { platform_role: 'owner' } } },
      error: null,
    });
    adminMock.auth.admin.updateUserById.mockResolvedValue({ data: {}, error: null });
    adminMock.auth.admin.deleteUser.mockResolvedValue({ data: {}, error: null });

    service = new OnboardingService(
      { create: createTenant } as unknown as TenantsService,
      { client: { tenant: { delete: deleteTenant } } } as unknown as PrismaService,
    );
  });

  it('creates the account, tenant and binding server-side', async () => {
    const result = await service.register(input);

    expect(result).toEqual({ tenantId: 'ten-1' });
    expect(adminMock.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'raul@nuevo.dev',
      password: 'secreto123',
      email_confirm: true,
      user_metadata: { full_name: 'Raúl Gómez' },
    });
    expect(createTenant).toHaveBeenCalled();
    expect(adminMock.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', {
      app_metadata: { platform_role: 'owner', tenant_id: 'ten-1' },
    });
  });

  it('maps a duplicate email to EMAIL_TAKEN without creating a tenant', async () => {
    adminMock.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    await expect(service.register(input)).rejects.toMatchObject({
      extensions: { code: 'EMAIL_TAKEN' },
    });
    expect(createTenant).not.toHaveBeenCalled();
  });

  it('compensates (deletes user + tenant) when binding fails', async () => {
    adminMock.auth.admin.updateUserById.mockResolvedValue({
      data: {},
      error: { message: 'boom' },
    });

    await expect(service.register(input)).rejects.toMatchObject({
      extensions: { code: 'STATE_ERROR' },
    });
    expect(adminMock.auth.admin.deleteUser).toHaveBeenCalledWith('user-1');
    expect(deleteTenant).toHaveBeenCalledWith({ where: { id: 'ten-1' } });
  });

  it('rejects invalid input before touching the provider', async () => {
    await expect(
      service.register({ ...input, account: { ...input.account, email: 'nope' } }),
    ).rejects.toMatchObject({ extensions: { code: 'VALIDATION_ERROR' } });
    expect(adminMock.auth.admin.createUser).not.toHaveBeenCalled();
  });
});
