export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

let initialized = false;

export function initAnalytics(): void {
  initialized = true;
}

export function trackEvent(event: AnalyticsEvent): void {
  if (!initialized || typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent<AnalyticsEvent>('analytics:event', { detail: event }));
}
