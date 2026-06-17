import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { toCommentResponse } from '../common/mappers/comment.mapper';
import { isAuthorOrAdmin } from '../common/utils/authorization.util';
import { PrismaService } from '../database/prisma.service';
import type { CommentResponseDto } from './dto/comment-response.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByPost(postId: string): Promise<CommentResponseDto[]> {
    await this.ensurePostExists(postId);

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map(toCommentResponse);
  }

  async create(
    postId: string,
    dto: CreateCommentDto,
    user: AuthenticatedUser,
  ): Promise<CommentResponseDto> {
    await this.ensurePostExists(postId);

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.body,
        postId,
        authorId: user.id,
        metadata: dto.metadata ?? {},
      },
    });

    return toCommentResponse(comment);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (!isAuthorOrAdmin(user, comment.authorId)) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.prisma.comment.delete({ where: { id } });
  }

  private async ensurePostExists(postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }
}
