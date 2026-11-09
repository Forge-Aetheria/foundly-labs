import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { validationError } from '../../shared/tenant-scope';
import { createSupabaseAdminClient } from '../../shared/supabase/admin-client';
import { TenantsService } from '../tenants/tenants.service';
import type { RegisterBusinessInput, RegisterBusinessResult } from './onboarding.types';

function stateError(message = 'No pudimos completar el alta. Inténtalo de nuevo.'): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'STATE_ERROR' } });
}

function emailTaken(message = 'Email already registered'): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'EMAIL_TAKEN' } });
}

function slugTaken(message = 'Slug already taken'): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'SLUG_TAKEN' } });
}

/**
 * Secure business registration (feature 024).
 * Creates the Supabase account, the tenant and the `tenant_id` binding using the
 * server-side service role. The browser never sees privileged credentials.
 */
@Injectable()
export class OnboardingService {
  constructor(
    private readonly tenants: TenantsService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: RegisterBusinessInput): Promise<RegisterBusinessResult> {
    const fullName = input.account?.fullName?.trim() ?? '';
    const email = input.account?.email?.trim().toLowerCase() ?? '';
    const password = input.account?.password ?? '';
    const name = input.business?.name?.trim() ?? '';
    const category = input.business?.category?.trim() ?? '';
    const slug = input.business?.slug?.trim().toLowerCase() ?? '';

    if (!fullName || !email || !password || !name || !category || !slug) {
      throw validationError('All registration fields are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw validationError('Invalid email');
    }
    if (password.length < 8) {
      throw validationError('Password must be at least 8 characters');
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw stateError('La autenticación remota no está configurada.');
    }

    const { data: createdUser, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (signUpError || !createdUser.user?.id) {
      const message = signUpError?.message ?? '';
      if (message.toLowerCase().includes('registered') || message.toLowerCase().includes('exists')) {
        throw emailTaken('Ese email ya está registrado.');
      }
      throw new GraphQLError(message || 'No se pudo crear la cuenta.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    const userId = createdUser.user.id;

    let tenantId: string | null = null;
    try {
      const tenant = await this.tenants.create({
        name,
        category,
        timezone: 'Europe/Madrid',
        currency: 'EUR',
        profile: { slug },
      });
      tenantId = tenant.id;

      const { data: userData } = await admin.auth.admin.getUserById(userId);
      const existingMetadata = (userData.user?.app_metadata ?? {}) as Record<string, unknown>;
      const { error: bindError } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { ...existingMetadata, tenant_id: tenant.id },
      });
      if (bindError) {
        throw stateError('No se pudo vincular el negocio a tu cuenta.');
      }

      return { tenantId: tenant.id };
    } catch (error) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
      if (tenantId) {
        await this.prisma.client.tenant.delete({ where: { id: tenantId } }).catch(() => undefined);
      }
      if (error instanceof GraphQLError) {
        const code = error.extensions?.code;
        if (code === 'CONFLICT') {
          throw slugTaken('Ese enlace público ya está en uso.');
        }
        throw error;
      }
      throw stateError();
    }
  }
}
