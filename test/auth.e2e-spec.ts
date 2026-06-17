import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const testEmail = `auth-${randomUUID()}@example.com`;
  const testPassword = 'securepass123';
  let accessToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/auth/register creates a user and returns a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    const body = response.body as {
      data: { accessToken: string; user: { email: string } };
    };

    accessToken = body.data.accessToken;
    expect(body.data.user.email).toBe(testEmail);
    expect(body.data.user).not.toHaveProperty('passwordHash');
  });

  it('POST /v1/auth/login returns a token for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    const body = response.body as { data: { accessToken: string } };
    accessToken = body.data.accessToken;
    expect(accessToken).toEqual(expect.any(String));
  });

  it('GET /v1/users/me requires authentication', async () => {
    await request(app.getHttpServer()).get('/v1/users/me').expect(401);
  });

  it('GET /v1/users/me returns the current user with a valid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as { data: { email: string } };
    expect(body.data.email).toBe(testEmail);
  });
});
