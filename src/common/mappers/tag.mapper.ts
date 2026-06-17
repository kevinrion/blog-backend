import type { Tag } from '@prisma/client';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export function toTagResponse(tag: Tag): TagResponseDto {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}
