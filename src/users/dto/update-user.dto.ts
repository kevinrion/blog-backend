import { ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: { displayName: 'Jane Doe' } })
  @IsOptional()
  @IsObject()
  metadata?: Prisma.InputJsonValue;
}
