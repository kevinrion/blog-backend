import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';

describe('Comments (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken = '';
  let postId = '';
  let commentId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    configureApp(app);
    await app.init();

    const email = `comments-${randomUUID()}@example.com`;
    const register = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password: 'securepass123' });

    accessToken = (register.body as { data: { accessToken: string } }).data.accessToken;

    const post = await request(app.getHttpServer())
      .post('/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Comment target',
        content: 'Body',
        published: true,
      });

    postId = (post.body as { data: { id: string } }).data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, lists, and deletes a comment', async () => {
    const createResponse = await request(app.getHttpServer())
      .post(`/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'Great post' })
      .expect(201);

    commentId = (createResponse.body as { data: { id: string } }).data.id;

    const listResponse = await request(app.getHttpServer())
      .get(`/v1/posts/${postId}/comments`)
      .expect(200);

    const comments = (listResponse.body as { data: { id: string }[] }).data;
    expect(comments.some((comment) => comment.id === commentId)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
