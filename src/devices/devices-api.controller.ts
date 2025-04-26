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
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
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
import { DeviceResponseDto } from './dto/device-response.dto';
import { PaginationDto } from '../users/dto/pagination.dto';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Устройства')
@Controller('api/devices')
@ApiBearerAuth('JWT-auth')
export class DevicesApiController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Создать новую запись устройства' })
  @ApiCreatedResponse({
    description: 'Устройство успешно зарегистрировано.',
    type: DeviceResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  async create(
    @Body() createDeviceDto: CreateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return await this.devicesService.create(createDeviceDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить все устройства с пагинацией' })
  @ApiOkResponse({
    description: 'Список устройств.',
    type: [DeviceResponseDto],
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
    const result = await this.devicesService.findAllWithPagination({
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);
    const links: string[] = [];
    const baseUrl = '/api/devices';

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
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Получить устройства пользователя по ID пользователя',
  })
  @ApiOkResponse({
    description: 'Устройства пользователя.',
    type: [DeviceResponseDto],
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID пользователя' })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<DeviceResponseDto[]> {
    return await this.devicesService.findByUserId(userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить устройство по ID' })
  @ApiOkResponse({ description: 'Устройство.', type: DeviceResponseDto })
  @ApiNotFoundResponse({ description: 'Устройство не найдено.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID устройства' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeviceResponseDto> {
    return await this.devicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить устройство по ID' })
  @ApiOkResponse({
    description: 'Устройство успешно обновлено.',
    type: DeviceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Устройство не найдено.' })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID устройства' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return await this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Удалить устройство по ID' })
  @ApiOkResponse({ description: 'Устройство успешно удалено.' })
  @ApiNotFoundResponse({ description: 'Устройство не найдено.' })
  @ApiParam({ name: 'id', type: Number, description: 'ID устройства' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return await this.devicesService.remove(id);
  }
}
