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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ReviewResponseDto } from './dto/review-response.dto';
import { PaginationDto } from '../users/dto/pagination.dto';
import { Response } from 'express';

@ApiTags('Отзывы')
@Controller('api/reviews')
export class ReviewsApiController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый отзыв' })
  @ApiCreatedResponse({
    description: 'Отзыв успешно создан.',
    type: ReviewResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  @ApiConflictResponse({
    description: 'Вы уже оставили отзыв для этого проекта.',
  })
  async create(
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return await this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все отзывы с пагинацией' })
  @ApiOkResponse({
    description: 'Список отзывов.',
    type: [ReviewResponseDto],
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
    const result = await this.reviewsService.findAllWithPagination({
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);
    const links: string[] = [];
    const baseUrl = '/api/reviews';

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
  @ApiOperation({ summary: 'Получить отзывы проекта по ID проекта' })
  @ApiOkResponse({ description: 'Отзывы проекта.', type: [ReviewResponseDto] })
  @ApiParam({ name: 'projectId', type: Number, description: 'ID проекта' })
  async findByProjectId(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ReviewResponseDto[]> {
    return await this.reviewsService.findByProjectId(projectId);
  }

  @Get('project/:projectId/rating')
  @ApiOperation({ summary: 'Получить средний рейтинг проекта' })
  @ApiOkResponse({
    description: 'Средний рейтинг проекта.',
    schema: {
      type: 'number',
      example: 4.5,
    },
  })
  @ApiParam({ name: 'projectId', type: Number, description: 'ID проекта' })
  async getProjectAverageRating(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<number> {
    return await this.reviewsService.getProjectAverageRating(projectId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить отзывы пользователя по ID пользователя' })
  @ApiOkResponse({
    description: 'Отзывы пользователя.',
    type: [ReviewResponseDto],
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID пользователя' })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ReviewResponseDto[]> {
    return await this.reviewsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить отзыв по ID' })
  @ApiOkResponse({ description: 'Отзыв.', type: ReviewResponseDto })
  @ApiNotFoundResponse({ description: 'Отзыв не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID отзыва' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReviewResponseDto> {
    return await this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить отзыв по ID' })
  @ApiOkResponse({
    description: 'Отзыв успешно обновлен.',
    type: ReviewResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Отзыв не найден.' })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID отзыва' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return await this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить отзыв по ID' })
  @ApiOkResponse({ description: 'Отзыв успешно удален.' })
  @ApiNotFoundResponse({ description: 'Отзыв не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID отзыва' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return await this.reviewsService.remove(id);
  }
}