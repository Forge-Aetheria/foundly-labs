import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createLogger } from './shared/logger/logger';

const DEFAULT_PORT = 3002;

async function bootstrap(): Promise<void> {
  const logger = createLogger();
  const app = await NestFactory.create(AppModule, { logger });
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  await app.listen(port);
  logger.log(`Foundly API listening on http://localhost:${port}`);
}

void bootstrap();
