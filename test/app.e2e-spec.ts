import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';

describe('Platform layer (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns liveness status', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('GET /ready returns readiness or service unavailable', async () => {
    const response = await request(app.getHttpServer()).get('/ready');

    expect([200, 503]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body).toEqual({ status: 'ok' });
    } else {
      const body = response.body as {
        statusCode: number;
        errorCode: string;
        correlationId: string;
      };
      expect(body.statusCode).toBe(503);
      expect(body.errorCode).toBe('INTERNAL_ERROR');
      expect(body.correlationId).toEqual(expect.any(String));
    }
  });

  it('assigns a correlation ID on responses', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('propagates an incoming X-Request-Id header', async () => {
    const correlationId = 'test-correlation-id';

    const response = await request(app.getHttpServer())
      .get('/health')
      .set('X-Request-Id', correlationId);

    expect(response.headers['x-request-id']).toBe(correlationId);
  });
});
