import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: {
    post: { findUnique: jest.Mock };
    comment: {
      findMany: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn().mockResolvedValue({ id: 'post-id' }) },
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CommentsService);
  });

  it('creates a comment for an existing post', async () => {
    prisma.comment.create.mockResolvedValue({
      id: 'comment-id',
      body: 'Nice',
      postId: 'post-id',
      authorId: 'user-id',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create(
      'post-id',
      { body: 'Nice' },
      { id: 'user-id', email: 'u@example.com', role: UserRole.USER },
    );

    expect(result.body).toBe('Nice');
  });

  it('throws when post does not exist', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(
      service.create(
        'missing',
        { body: 'Nice' },
        { id: 'user-id', email: 'u@example.com', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents deleting another users comment', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      id: 'comment-id',
      authorId: 'owner-id',
    });

    await expect(
      service.remove('comment-id', {
        id: 'other-id',
        email: 'other@example.com',
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
