import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'NestJS' })
  name!: string;

  @ApiProperty({ example: 'nestjs' })
  slug!: string;
}
