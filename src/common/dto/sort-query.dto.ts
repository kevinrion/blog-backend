import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class SortQueryDto {
  @ApiPropertyOptional({
    example: 'createdAt:desc',
    description: 'Sort field and direction. Format: field:asc|desc. Example: createdAt:desc',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]+:(asc|desc)$/, {
    message: 'sort must use the format field:asc or field:desc',
  })
  sort?: string;
}
