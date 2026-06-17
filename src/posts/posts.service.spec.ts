import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: {
    post: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    tag: { findMany: jest.Mock };
    postTag: { deleteMany: jest.Mock; createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const author = { id: 'author-id', email: 'a@example.com', role: UserRole.USER };
  const post = {
    id: 'post-id',
    title: 'Hello',
    slug: 'hello',
    content: 'Body',
    published: true,
    authorId: author.id,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
  };

  beforeEach(async () => {
    prisma = {
      post: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tag: { findMany: jest.fn().mockResolvedValue([]) },
      postTag: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PostsService);
  });

  it('lists only published posts for anonymous users', async () => {
    prisma.post.findMany.mockResolvedValue([post]);
    prisma.post.count.mockResolvedValue(1);

    const result = await service.list({});

    const [firstCall] = prisma.post.findMany.mock.calls as Array<
      [{ where: { published: boolean } }]
    >;

    expect(firstCall[0].where.published).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('throws when unpublished post is requested without auth', async () => {
    prisma.post.findUnique.mockResolvedValue({ ...post, published: false });

    await expect(service.findBySlug('hello')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents non-authors from deleting posts', async () => {
    prisma.post.findUnique.mockResolvedValue(post);

    await expect(
      service.remove('post-id', {
        id: 'other-user',
        email: 'other@example.com',
        role: UserRole.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
