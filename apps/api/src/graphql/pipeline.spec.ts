import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Query, Resolver } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { PrismaService } from '../shared/prisma/prisma.service';
import { createLogger, FoundlyLogger } from '../shared/logger/logger';
import { buildRequestPlugins } from './logging.plugin';
import { formatGraphQLError } from './errors';

interface Sink {
  lines: string[];
  stream: { write(chunk: string | Uint8Array): boolean };
}

function capture(): Sink {
  const lines: string[] = [];
  return {
    lines,
    stream: {
      write: (chunk: string | Uint8Array): boolean => {
        lines.push(String(chunk));
        return true;
      },
    },
  };
}

@Resolver()
class PingResolver {
  @Query(() => String)
  ping(): string {
    return 'pong';
  }

  @Query(() => String)
  boom(): string {
    throw new Error('db secret 123 with token abcdef');
  }
}

interface ErrorBody {
  message?: string;
  extensions?: Record<string, unknown>;
}

function firstError(body: Record<string, unknown>): ErrorBody | undefined {
  return (body.errors as ErrorBody[] | undefined)?.[0];
}

describe('GraphQL error pipeline (009-structured-logging-errors)', () => {
  describe('lifecycle logging (US1)', () => {
    let app: INestApplication;
    let sink: Sink;
    let logger: FoundlyLogger;

    beforeAll(async () => {
      sink = capture();
      logger = createLogger({ stream: sink.stream });
      const moduleRef = await Test.createTestingModule({
        imports: [
          GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,

            plugins: buildRequestPlugins(logger),
          }),
        ],
        providers: [PingResolver],
      }).compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('emits a start and a resolution log record per request', async () => {
      sink.lines.length = 0;
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: 'query P { ping }' })
        .expect(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.ping).toBe('pong');

      const records = sink.lines.map((line) => JSON.parse(line) as Record<string, unknown>);
      const start = records.find((r) => r.msg === 'graphql request start');
      const resolved = records.find((r) => r.msg === 'graphql request completed');
      expect(start).toBeDefined();
      expect(resolved).toBeDefined();
      expect(typeof (start as Record<string, unknown>).requestId).toBe('string');
      expect(typeof (start as Record<string, unknown>).operation).toBe('string');
      expect(typeof (resolved as Record<string, unknown>).durationMs).toBe('number');
      expect(resolved?.errorCount).toBe(0);
    });
  });

  describe('error envelope + masking (US2 via AppModule)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue({
          client: { $queryRaw: () => Promise.resolve([{ '?column?': 1 }]) },
        } as unknown as PrismaService)
        .compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns the known-code envelope for viewer without a token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ viewer { sub } }' })
        .expect(200);
      const error = response.body.errors?.[0];
      expect(error?.extensions?.code).toBe('UNAUTHENTICATED');
      expect(typeof error?.extensions?.timestamp).toBe('string');
      expect(Array.isArray(error?.path)).toBe(true);
    });
  });

  describe('unknown/internal error masking (US2, test-only module)', () => {
    async function build(env: string | undefined): Promise<INestApplication> {
      if (env === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = env;
      const moduleRef = await Test.createTestingModule({
        imports: [
          GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            formatError: formatGraphQLError,
          }),
        ],
        providers: [PingResolver],
      }).compile();
      const app = moduleRef.createNestApplication();
      await app.init();
      return app;
    }

    async function queryBoom(app: INestApplication): Promise<Record<string, unknown>> {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ boom }' })
        .expect(200);
      return response.body as Record<string, unknown>;
    }

    it('masks unknown errors in production (generic code, no detail, no secret)', async () => {
      const app = await build('production');
      try {
        const body = await queryBoom(app);
        const error = firstError(body);
        expect(error?.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error?.message).toBe('Internal server error');
        expect(JSON.stringify(body)).not.toContain('db secret 123');
        expect(JSON.stringify(body)).not.toContain('abcdef');
      } finally {
        delete process.env.NODE_ENV;
        await app.close();
      }
    });

    it('reveals detail outside production', async () => {
      const app = await build(undefined);
      try {
        const body = await queryBoom(app);
        const error = firstError(body);
        expect(JSON.stringify(body)).toContain('db secret 123');
        expect(error?.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
      } finally {
        await app.close();
      }
    });
  });
});