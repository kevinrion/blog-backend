import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { toPostResponse } from '../common/mappers/post.mapper';
import { buildPaginatedResponse, normalizePagination } from '../common/utils/pagination.util';
import { parseSortParam } from '../common/utils/sort.util';
import { slugify } from '../common/utils/slug.util';
import { isAuthorOrAdmin } from '../common/utils/authorization.util';
import { PrismaService } from '../database/prisma.service';
import type { PaginatedApiResponse } from '../common/interfaces/api-response.interface';
import type { CreatePostDto } from './dto/create-post.dto';
import type { PostResponseDto } from './dto/post-response.dto';
import type { PostsListQueryDto } from './dto/list-posts-query.dto';
import type { UpdatePostDto } from './dto/update-post.dto';

const POST_INCLUDE = {
  tags: { include: { tag: true } },
} satisfies Prisma.PostInclude;

const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title']);

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: PostsListQueryDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedApiResponse<PostResponseDto>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const sort = parseSortParam(query.sort);
    const orderBy =
      sort && ALLOWED_SORT_FIELDS.has(sort.field)
        ? { [sort.field]: sort.direction }
        : { createdAt: 'desc' as const };

    const publishedOnly =
      user?.role === UserRole.ADMIN && query.published !== undefined ? query.published : true;

    const where: Prisma.PostWhereInput = {
      published: publishedOnly,
      ...(query.tagSlug ? { tags: { some: { tag: { slug: query.tagSlug } } } } : {}),
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return buildPaginatedResponse(posts.map(toPostResponse), total, page, limit);
  }

  async findBySlug(slug: string, user?: AuthenticatedUser): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.published) {
      if (!user || !isAuthorOrAdmin(user, post.authorId)) {
        throw new NotFoundException('Post not found');
      }
    }

    return toPostResponse(post);
  }

  async create(dto: CreatePostDto, user: AuthenticatedUser): Promise<PostResponseDto> {
    const slug = await this.generateUniqueSlug(dto.title);
    const tagIds = await this.resolveTagIds(dto.tagSlugs);

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        published: dto.published ?? false,
        authorId: user.id,
        metadata: dto.metadata ?? {},
        tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: POST_INCLUDE,
    });

    return toPostResponse(post);
  }

  async update(id: string, dto: UpdatePostDto, user: AuthenticatedUser): Promise<PostResponseDto> {
    const existing = await this.findPostOrThrow(id);
    this.assertCanModify(existing.authorId, user);

    const tagIds = dto.tagSlugs !== undefined ? await this.resolveTagIds(dto.tagSlugs) : undefined;

    const post = await this.prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.postTag.deleteMany({ where: { postId: id } });
        if (tagIds.length > 0) {
          await tx.postTag.createMany({
            data: tagIds.map((tagId) => ({ postId: id, tagId })),
          });
        }
      }

      return tx.post.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.content !== undefined ? { content: dto.content } : {}),
          ...(dto.published !== undefined ? { published: dto.published } : {}),
          ...(dto.metadata !== undefined ? { metadata: dto.metadata } : {}),
        },
        include: POST_INCLUDE,
      });
    });

    return toPostResponse(post);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const existing = await this.findPostOrThrow(id);
    this.assertCanModify(existing.authorId, user);
    await this.prisma.post.delete({ where: { id } });
  }

  private async findPostOrThrow(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private assertCanModify(authorId: string, user: AuthenticatedUser): void {
    if (!isAuthorOrAdmin(user, authorId)) {
      throw new ForbiddenException('You cannot modify this post');
    }
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title) || 'post';
    let candidate = baseSlug;
    let suffix = 1;

    while (await this.prisma.post.findUnique({ where: { slug: candidate } })) {
      candidate = `${baseSlug}-${String(suffix)}`;
      suffix += 1;
    }

    return candidate;
  }

  private async resolveTagIds(tagSlugs?: string[]): Promise<string[]> {
    if (!tagSlugs || tagSlugs.length === 0) {
      return [];
    }

    const tags = await this.prisma.tag.findMany({
      where: { slug: { in: tagSlugs } },
    });

    if (tags.length !== tagSlugs.length) {
      throw new NotFoundException('One or more tags were not found');
    }

    return tags.map((tag) => tag.id);
  }
}
