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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectResponseDto } from './dto/project-response.dto';
import { PaginationDto } from '../users/dto/pagination.dto';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Проекты')
@Controller('api/projects')
@ApiBearerAuth('JWT-auth')
export class ProjectsApiController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый проект' })
  @ApiCreatedResponse({
    description: 'Проект успешно создан.',
    type: ProjectResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return await this.projectsService.create(createProjectDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Получить все проекты с пагинацией' })
  @ApiOkResponse({
    description: 'Список проектов.',
    type: [ProjectResponseDto],
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
    const result = await this.projectsService.findAllWithPagination({
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);
    const links: string[] = [];
    const baseUrl = '/api/projects';

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

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить проекты пользователя по ID пользователя' })
  @ApiOkResponse({
    description: 'Проекты пользователя.',
    type: [ProjectResponseDto],
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID пользователя' })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ProjectResponseDto[]> {
    return await this.projectsService.findByUserId(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Получить проект по ID' })
  @ApiOkResponse({ description: 'Проект.', type: ProjectResponseDto })
  @ApiNotFoundResponse({ description: 'Проект не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID проекта' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectResponseDto> {
    return await this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить проект по ID' })
  @ApiOkResponse({
    description: 'Проект успешно обновлен.',
    type: ProjectResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Проект не найден.' })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID проекта' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return await this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Удалить проект по ID' })
  @ApiOkResponse({ description: 'Проект успешно удален.' })
  @ApiNotFoundResponse({ description: 'Проект не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID проекта' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return await this.projectsService.remove(id);
  }
}
