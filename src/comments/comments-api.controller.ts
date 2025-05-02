import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommentResponseDto } from './dto/comment-response.dto';
import { PaginationDto } from '../users/dto/pagination.dto';
import { Response } from 'express';

@ApiTags('Комментарии')
@Controller('api/comments')
export class CommentsApiController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый комментарий' })
  @ApiCreatedResponse({
    description: 'Комментарий успешно создан.',
    type: CommentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  async create(
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.create(createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все комментарии с пагинацией' })
  @ApiOkResponse({
    description: 'Список комментариев.',
    type: [CommentResponseDto],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы для пагинации',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество элементов на странице',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Res() res: Response,
  ): Promise<void> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const result = await this.commentsService.findAllWithPagination({
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);
    const links: string[] = [];
    const baseUrl = '/api/comments';

    links.push(`<${baseUrl}?page=1&limit=${limit}>; rel="first"`);
    links.push(`<${baseUrl}?page=${totalPages}&limit=${limit}>; rel="last"`);
    if (page > 1) {
      links.push(`<${baseUrl}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    }
    if (page < totalPages) {
      links.push(`<${baseUrl}?page=${page + 1}&limit=${limit}>; rel="next"`);
    }

    res.set('Link', links.join(', '));
    res.json({ data: result.data, total: result.total });
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Получить комментарии проекта по ID проекта' })
  @ApiOkResponse({
    description: 'Комментарии проекта.',
    type: [CommentResponseDto],
  })
  @ApiParam({ name: 'projectId', type: Number, description: 'ID проекта' })
  async findByProjectId(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<CommentResponseDto[]> {
    return await this.commentsService.findByProjectId(projectId);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Получить комментарии пользователя по ID пользователя',
  })
  @ApiOkResponse({
    description: 'Комментарии пользователя.',
    type: [CommentResponseDto],
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID пользователя' })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<CommentResponseDto[]> {
    return await this.commentsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить комментарий по ID' })
  @ApiOkResponse({ description: 'Комментарий.', type: CommentResponseDto })
  @ApiNotFoundResponse({ description: 'Комментарий не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID комментария' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить комментарий по ID' })
  @ApiOkResponse({
    description: 'Комментарий успешно обновлен.',
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Комментарий не найден.' })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID комментария' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить комментарий по ID' })
  @ApiOkResponse({ description: 'Комментарий успешно удален.' })
  @ApiNotFoundResponse({ description: 'Комментарий не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID комментария' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return await this.commentsService.remove(id);
  }
}