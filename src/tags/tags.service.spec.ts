import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  let service: TagsService;

  beforeEach(async () => {
    const prisma = {
      tag: {
        findMany: jest.fn().mockResolvedValue([{ id: '1', name: 'NestJS', slug: 'nestjs' }]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TagsService);
  });

  it('returns all tags', async () => {
    const tags = await service.findAll();
    expect(tags).toEqual([{ id: '1', name: 'NestJS', slug: 'nestjs' }]);
  });
});
