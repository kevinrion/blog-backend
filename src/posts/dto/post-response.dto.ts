import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class PostResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  published!: boolean;

  @ApiProperty({ format: 'uuid' })
  authorId!: string;

  @ApiProperty()
  metadata!: Prisma.JsonValue;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [TagResponseDto] })
  tags?: TagResponseDto[];
}
