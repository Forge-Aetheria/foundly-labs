import { resolveApiUrl } from './apiClient';

export interface HealthPayload {
  service: string;
  status: string;
}

/**
 * Dev-only connectivity check (feature 008 — US4, api-connectivity.contract.md).
 * `GET {API_URL}/` expects `200 {"service":"foundly-api","status":"ok"}`.
 * Returns null when the API is unreachable or not configured.
 */
export async function checkHealth(): Promise<HealthPayload | null> {
  const url = resolveApiUrl();
  if (!url) return null;
  try {
    const response = await fetch(`${url.replace(/\/+$/, '')}/`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Partial<HealthPayload>;
    return payload.service && payload.status
      ? { service: payload.service, status: payload.status }
      : null;
  } catch {
    return null;
  }
}