import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ example: { displayName: 'Jane' } })
  metadata!: Prisma.JsonValue;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
