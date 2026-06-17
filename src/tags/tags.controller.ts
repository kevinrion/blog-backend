import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ApiResponse } from '../common/interfaces/api-response.interface';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOkResponse({ type: [TagResponseDto] })
  async findAll(): Promise<ApiResponse<TagResponseDto[]>> {
    const data = await this.tagsService.findAll();
    return { data };
  }
}
