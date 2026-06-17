import type { Comment } from '@prisma/client';
import { CommentResponseDto } from '../../comments/dto/comment-response.dto';

export function toCommentResponse(comment: Comment): CommentResponseDto {
  return {
    id: comment.id,
    body: comment.body,
    postId: comment.postId,
    authorId: comment.authorId,
    metadata: comment.metadata,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}
