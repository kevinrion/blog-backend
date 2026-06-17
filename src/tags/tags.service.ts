import { Injectable } from '@nestjs/common';
import { toTagResponse } from '../common/mappers/tag.mapper';
import { PrismaService } from '../database/prisma.service';
import type { TagResponseDto } from './dto/tag-response.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });

    return tags.map(toTagResponse);
  }
}
