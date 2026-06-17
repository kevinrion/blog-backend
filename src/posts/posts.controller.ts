import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type {
  ApiResponse,
  PaginatedApiResponse,
} from '../common/interfaces/api-response.interface';
import { OptionalCurrentUser } from '../auth/decorators/optional-current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsListQueryDto } from './dto/list-posts-query.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Paginated list of posts' })
  async list(
    @Query() query: PostsListQueryDto,
    @OptionalCurrentUser() user?: AuthenticatedUser,
  ): Promise<PaginatedApiResponse<PostResponseDto>> {
    return this.postsService.list(query, user);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ type: PostResponseDto })
  async findBySlug(
    @Param('slug') slug: string,
    @OptionalCurrentUser() user?: AuthenticatedUser,
  ): Promise<ApiResponse<PostResponseDto>> {
    const data = await this.postsService.findBySlug(slug, user);
    return { data };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PostResponseDto })
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<PostResponseDto>> {
    const data = await this.postsService.create(dto, user);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PostResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<PostResponseDto>> {
    const data = await this.postsService.update(id, dto, user);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.postsService.remove(id, user);
  }
}
