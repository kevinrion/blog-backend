import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';

describe('Posts (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken = '';
  let postId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    configureApp(app);
    await app.init();

    const email = `posts-${randomUUID()}@example.com`;
    const register = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password: 'securepass123' });

    accessToken = (register.body as { data: { accessToken: string } }).data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, publishes, lists, and deletes a post', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'E2E Test Post',
        content: 'Post content',
        published: false,
        tagSlugs: ['nestjs'],
      })
      .expect(201);

    const created = createResponse.body as {
      data: { id: string; slug: string; published: boolean };
    };
    postId = created.data.id;
    expect(created.data.slug).toMatch(/^e2e-test-post/);
    expect(created.data.published).toBe(false);

    await request(app.getHttpServer())
      .patch(`/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ published: true })
      .expect(200);

    const listResponse = await request(app.getHttpServer())
      .get('/v1/posts?tagSlug=nestjs')
      .expect(200);

    const listBody = listResponse.body as {
      data: { slug: string }[];
      meta: { total: number };
    };
    expect(listBody.meta.total).toBeGreaterThanOrEqual(1);

    const slugResponse = await request(app.getHttpServer())
      .get(`/v1/posts/${created.data.slug}`)
      .expect(200);

    expect((slugResponse.body as { data: { slug: string } }).data.slug).toBe(created.data.slug);

    await request(app.getHttpServer())
      .delete(`/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('rejects duplicate slugs via generated suffixes', async () => {
    const payload = {
      title: 'Duplicate Slug Post',
      content: 'First',
    };

    const first = await request(app.getHttpServer())
      .post('/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...payload, content: 'Second' })
      .expect(201);

    const firstSlug = (first.body as { data: { slug: string } }).data.slug;
    const secondSlug = (second.body as { data: { slug: string } }).data.slug;
    expect(secondSlug).not.toBe(firstSlug);
  });
});
