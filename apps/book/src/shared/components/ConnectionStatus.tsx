import { Badge, Stack } from '@foundly/ui';
import { checkHealth } from '../infra/health';

/**
 * Dev-only connectivity indicator (feature 008 — US4). Server component;
 * renders a small badge reflecting whether the Foundly API is reachable.
 * Not a security boundary — purely a developer diagnostic.
 */
export async function ConnectionStatus() {
  const healthy = await checkHealth();
  if (process.env.NODE_ENV !== 'development' && !healthy) {
    return null;
  }
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
      <Badge pill status={healthy ? 'positive' : 'neutral'}>
        {healthy ? `API conectada (${healthy.service})` : 'API sin conexión'}
      </Badge>
      {!healthy ? null : <Badge pill status="neutral">{healthy.status}</Badge>}
    </Stack>
  );
}