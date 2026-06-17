import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ format: 'uuid' })
  postId!: string;

  @ApiProperty({ format: 'uuid' })
  authorId!: string;

  @ApiProperty()
  metadata!: Prisma.JsonValue;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
