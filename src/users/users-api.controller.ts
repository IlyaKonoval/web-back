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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Response } from 'express';

@ApiTags('Пользователи')
@Controller('api/users')
export class UsersApiController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать нового пользователя' })
  @ApiCreatedResponse({
    description: 'Пользователь успешно создан.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  @ApiConflictResponse({ description: 'Email уже существует.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      registrationDate: user.registrationDate,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех пользователей с пагинацией' })
  @ApiOkResponse({
    description: 'Список пользователей.',
    type: [UserResponseDto],
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
    const result = await this.usersService.findAllWithPagination({
      page,
      limit,
    });

    const safeUsers = result.data.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      registrationDate: user.registrationDate,
    }));

    const totalPages = Math.ceil(result.total / limit);
    const links: string[] = [];
    const baseUrl = '/api/users';

    links.push(`<${baseUrl}?page=1&limit=${limit}>; rel="first"`);
    links.push(`<${baseUrl}?page=${totalPages}&limit=${limit}>; rel="last"`);
    if (page > 1) {
      links.push(`<${baseUrl}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    }
    if (page < totalPages) {
      links.push(`<${baseUrl}?page=${page + 1}&limit=${limit}>; rel="next"`);
    }

    res.set('Link', links.join(', '));
    res.json({ data: safeUsers, total: result.total });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiOkResponse({ description: 'Пользователь.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Пользователь не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      registrationDate: user.registrationDate,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить пользователя по ID' })
  @ApiOkResponse({
    description: 'Пользователь успешно обновлен.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден.' })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      registrationDate: user.registrationDate,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя по ID' })
  @ApiOkResponse({ description: 'Пользователь успешно удален.' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return await this.usersService.remove(id);
  }
}
