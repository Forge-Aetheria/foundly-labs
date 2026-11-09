import { Injectable } from '@nestjs/common';

export interface TenantStatusCacheEntry {
  status: string;
  expiresAt: number;
}

/** Short-lived, per-process cache for tenant operability checks. */
@Injectable()
export class TenantStatusCache {
  private readonly entries = new Map<string, TenantStatusCacheEntry>();
  private ttlMs = 30_000;

  /** Test seam: shorten/lengthen the cache window without DI configuration. */
  setTtl(ttlMs: number): void {
    this.ttlMs = ttlMs;
  }

  get(tenantId: string, now = Date.now()): string | null {
    const entry = this.entries.get(tenantId);
    if (!entry) return null;
    if (entry.expiresAt <= now) {
      this.entries.delete(tenantId);
      return null;
    }
    return entry.status;
  }

  set(tenantId: string, status: string, now = Date.now()): void {
    this.entries.set(tenantId, { status, expiresAt: now + this.ttlMs });
  }

  clear(): void {
    this.entries.clear();
  }
}
