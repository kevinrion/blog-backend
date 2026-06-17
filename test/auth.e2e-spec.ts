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
      data: {
        accessToken: string;
        user: { email: string; id: string };
      };
    };

    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.user.email).toBe(testEmail);
    expect(body.data.user).not.toHaveProperty('passwordHash');
  });

  it('POST /v1/auth/register rejects duplicate email', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: testEmail, password: testPassword })
      .expect(409);

    const body = response.body as {
      statusCode: number;
      errorCode: string;
      correlationId: string;
    };

    expect(body.statusCode).toBe(409);
    expect(body.errorCode).toBe('CONFLICT');
    expect(body.correlationId).toEqual(expect.any(String));
  });

  it('POST /v1/auth/login returns a token for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    const body = response.body as {
      data: { accessToken: string; user: { email: string } };
    };

    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.user.email).toBe(testEmail);
  });

  it('POST /v1/auth/login rejects invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: 'wrong-password' })
      .expect(401);

    const body = response.body as {
      statusCode: number;
      errorCode: string;
    };

    expect(body.statusCode).toBe(401);
    expect(body.errorCode).toBe('UNAUTHORIZED');
  });

  it('GET /v1/auth/me requires authentication', async () => {
    await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
  });

  it('GET /v1/auth/me returns the current user with a valid token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    const loginBody = loginResponse.body as {
      data: { accessToken: string };
    };

    const meResponse = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .expect(200);

    const meBody = meResponse.body as {
      data: { email: string };
    };

    expect(meBody.data.email).toBe(testEmail);
  });
});
