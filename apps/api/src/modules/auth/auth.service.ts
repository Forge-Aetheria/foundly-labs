import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { GraphQLError } from 'graphql';
import type { SessionPayload } from './auth.context';

const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000;

function unauthError(): GraphQLError {
  return new GraphQLError('Unauthenticated', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

export interface SessionIdentity {
  userId: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class AuthService {
  private secret(): string {
    const secret = process.env.FOUNDLY_PASS_SECRET;
    if (!secret) {
      throw new Error('FOUNDLY_PASS_SECRET is not set');
    }
    return secret;
  }

  signSession(input: SessionIdentity, ttlMs: number = DEFAULT_TTL_MS): string {
    const payload: SessionPayload = {
      u: input.userId,
      t: input.tenantId,
      r: input.role,
      exp: Date.now() + ttlMs,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${this.sign(encoded)}`;
  }

  verifySession(token: string): SessionIdentity {
    if (typeof token !== 'string') {
      throw unauthError();
    }
    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw unauthError();
    }
    const encoded = parts[0] ?? '';
    const providedSignature = parts[1] ?? '';
    const expected = this.sign(encoded);
    const provided = Buffer.from(providedSignature, 'base64url');
    const expectedBuffer = Buffer.from(expected, 'base64url');
    if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
      throw unauthError();
    }

    let parsed: Partial<SessionPayload>;
    try {
      parsed = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as Partial<SessionPayload>;
    } catch {
      throw unauthError();
    }
    if (
      !parsed.u ||
      !parsed.t ||
      !parsed.r ||
      typeof parsed.exp !== 'number' ||
      parsed.exp <= Date.now()
    ) {
      throw unauthError();
    }
    return { userId: parsed.u, tenantId: parsed.t, role: parsed.r };
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret()).update(payload).digest('base64url');
  }
}
