import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly saltRounds = 10;

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        this.saltRounds,
      );

      const user = await this.prisma.user.create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          email: true,
          registrationDate: true,
        },
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Пользователь с email ${createUserDto.email} уже существует.`,
          );
        }
      }
      console.error('Error creating user:', error);

      let message = 'Не удалось создать пользователя.';
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  findAll() {
    try {
      return this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          registrationDate: true,
        },
      });
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new InternalServerErrorException(
        'Не удалось получить список пользователей.',
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
        this.prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            username: true,
            email: true,
            registrationDate: true,
          },
        }),
        this.prisma.user.count(), // Подсчет общего числа пользователей
      ]);

      // Возвращаем данные с общим количеством
      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error with pagination:', error);
      throw new InternalServerErrorException(
        'Не удалось получить пользователей с пагинацией.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          registrationDate: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`Пользователь с ID ${id} не найден.`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error finding user with ID ${id}:`, error);

      let message = `Не удалось найти пользователя с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      await this.findOne(id);

      const dataToUpdate: Prisma.UserUpdateInput = { ...updateUserDto };

      if (updateUserDto.password) {
        dataToUpdate.password = await bcrypt.hash(
          updateUserDto.password,
          this.saltRounds,
        );
      }

      return await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          username: true,
          email: true,
          registrationDate: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const conflictingEmail = updateUserDto.email || '(указанный email)';
          throw new ConflictException(
            `Email ${conflictingEmail} уже используется другим пользователем.`,
          );
        }
      } else if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error updating user with ID ${id}:`, error);

      let message = `Не удалось обновить пользователя с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number) {
    try {
      const user = await this.findOne(id);
      if (!user) {
        return false;
      }
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            `Невозможно удалить пользователя с ID ${id}, так как он связан с другими записями.`,
          );
        }
      } else if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error removing user with ID ${id}:`, error);

      let message = `Не удалось удалить пользователя с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }
}
