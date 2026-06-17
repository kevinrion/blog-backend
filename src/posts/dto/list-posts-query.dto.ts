import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PublishedFilterDto } from '../../common/dto/published-filter.dto';
import { SortQueryDto } from '../../common/dto/sort-query.dto';

export class PostsListQueryDto extends IntersectionType(
  PaginationQueryDto,
  SortQueryDto,
  PublishedFilterDto,
) {
  @ApiPropertyOptional({ example: 'nestjs', description: 'Filter by tag slug' })
  @IsOptional()
  @IsString()
  tagSlug?: string;
}
