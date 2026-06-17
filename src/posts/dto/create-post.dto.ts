import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'My first post' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'Post body content...' })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: { excerpt: 'A short summary' } })
  @IsOptional()
  @IsObject()
  metadata?: Prisma.InputJsonValue;

  @ApiPropertyOptional({
    example: ['nestjs', 'typescript'],
    description: 'Tag slugs to associate with the post',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagSlugs?: string[];
}
