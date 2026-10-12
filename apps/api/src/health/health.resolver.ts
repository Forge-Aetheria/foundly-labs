import { Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../shared/prisma/prisma.service';
import { HealthPayload } from './health.types';

const PROBE_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]);
}

/**
 * Public health query. Liveness is `status: "ok"` whenever the resolver runs;
 * readiness (`database`) is a read-only, bounded probe against the data seam.
 */
@Resolver()
export class HealthResolver {
  constructor(private readonly prismaService: PrismaService) {}

  @Query(() => HealthPayload)
  async health(): Promise<HealthPayload> {
    const database = await withTimeout(
      this.prismaService.client
        .$queryRaw`SELECT 1`
        .then(() => 'up' as const)
        .catch(() => 'down' as const),
      PROBE_TIMEOUT_MS,
      'down' as const,
    );
    return {
      service: 'foundly-api',
      status: 'ok',
      database,
      checkedAt: new Date().toISOString(),
    };
  }
}