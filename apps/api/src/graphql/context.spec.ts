import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { prisma } from '@foundly/database';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { PrismaService } from '../shared/prisma/prisma.service';
import { createContext, GraphQLContext } from './context';

describe('GraphQLContext (007-graphql-api-layer)', () => {
  it('exposes the shared database singleton, not a new client', () => {
    const context: GraphQLContext = createContext();
    expect(context.prisma).toBe(prisma);
  });

  it('serves GraphQL requests through the registered context seam', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        client: { $queryRaw: () => Promise.resolve([{ '?column?': 1 }]) },
      } as unknown as PrismaService)
      .compile();
    const app: INestApplication = moduleRef.createNestApplication();
    await app.init();

    try {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ health { service status database } }' })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.health).toMatchObject({
        service: 'foundly-api',
        status: 'ok',
        database: 'up',
      });
    } finally {
      await app.close();
    }
  });
});