import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createLogger } from './shared/logger/logger';

const DEFAULT_PORT = 3002;
const DEFAULT_CORS_ORIGINS = 'http://localhost:3001';

/** CORS allowlist from env (feature 008 — api-connectivity.contract.md). */
function corsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const logger = createLogger();
  const app = await NestFactory.create(AppModule, { logger });
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      // Allow non-browser calls (curl/server-to-server/tests) and allowlisted origins.
      if (!origin || corsOrigins().includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight'],
  });
  await app.listen(port);
  logger.log(`Foundly API listening on http://localhost:${port}`);
}

void bootstrap();
