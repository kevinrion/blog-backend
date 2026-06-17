import type { Prisma } from '@prisma/client';
import type { PostResponseDto } from '../../posts/dto/post-response.dto';

type PostWithTags = {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  authorId: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  tags?: { tag: { id: string; name: string; slug: string } }[];
};

export function toPostResponse(post: PostWithTags): PostResponseDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    published: post.published,
    authorId: post.authorId,
    metadata: post.metadata,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    tags: post.tags?.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
  };
}
