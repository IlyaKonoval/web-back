import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto) {
    try {
      const device = await this.prisma.device.create({
        data: {
          userAgent: createDeviceDto.userAgent,
          userId: createDeviceDto.userId,
        },
      });
      return device;
    } catch (error) {
      console.error('Error creating device:', error);
      let message = 'Не удалось создать запись устройства.';
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findAll() {
    try {
      return this.prisma.device.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding all devices:', error);
      throw new InternalServerErrorException(
        'Не удалось получить список устройств.',
      );
    }
  }

  async findAllWithPagination({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }) {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.device.findMany({
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.device.count(),
      ]);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error with pagination:', error);
      throw new InternalServerErrorException(
        'Не удалось получить устройства с пагинацией.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const device = await this.prisma.device.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!device) {
        throw new NotFoundException(`Устройство с ID ${id} не найдено.`);
      }
      return device;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error finding device with ID ${id}:`, error);

      let message = `Не удалось найти устройство с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findByUserId(userId: number) {
    try {
      const devices = await this.prisma.device.findMany({
        where: { userId },
        orderBy: { loginTime: 'desc' },
      });
      return devices;
    } catch (error) {
      console.error(`Error finding devices for user ${userId}:`, error);
      let message = `Не удалось найти устройства для пользователя с ID ${userId}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: number, updateDeviceDto: UpdateDeviceDto) {
    try {
      await this.findOne(id);

      const dataToUpdate: Prisma.DeviceUpdateInput = { ...updateDeviceDto };

      return await this.prisma.device.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error updating device with ID ${id}:`, error);

      let message = `Не удалось обновить устройство с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number) {
    try {
      const device = await this.findOne(id);
      if (!device) {
        return false;
      }
      await this.prisma.device.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error removing device with ID ${id}:`, error);

      let message = `Не удалось удалить устройство с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }
}
