import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';

describe('HealthResolver (GraphQL health, api-graphql contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers the health query over POST /graphql', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ health { service status } }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.health).toEqual({ service: 'foundly-api', status: 'ok' });
  });
});
