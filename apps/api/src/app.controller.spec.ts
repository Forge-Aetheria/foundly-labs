import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from './app.module';

describe('AppController (health, api-bootstrap contract)', () => {
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

  it('GET / answers 200 with the health payload', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    expect(response.body).toEqual({ service: 'foundly-api', status: 'ok' });
  });
});
