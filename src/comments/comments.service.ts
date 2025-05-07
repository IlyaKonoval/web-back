import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto) {
    try {
      const comment = await this.prisma.comment.create({
        data: {
          text: createCommentDto.text,
          userId: createCommentDto.userId,
          projectId: createCommentDto.projectId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      return comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      let message = 'Не удалось создать комментарий.';
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findAll(skip = 0, take = 10) {
    try {
      return this.prisma.comment.findMany({
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error finding all comments:', error);
      throw new InternalServerErrorException(
        'Не удалось получить список комментариев.',
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
        this.prisma.comment.findMany({
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
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.comment.count(),
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
        'Не удалось получить комментарии с пагинацией.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException(`Комментарий с ID ${id} не найден.`);
      }
      return comment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error finding comment with ID ${id}:`, error);

      let message = `Не удалось найти комментарий с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findByProjectId(projectId: number) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return comments;
    } catch (error) {
      console.error(`Error finding comments for project ${projectId}:`, error);
      let message = `Не удалось найти комментарии для проекта с ID ${projectId}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findByUserId(userId: number) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return comments;
    } catch (error) {
      console.error(`Error finding comments for user ${userId}:`, error);
      let message = `Не удалось найти комментарии пользователя с ID ${userId}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: number, updateCommentDto: UpdateCommentDto) {
    try {
      await this.findOne(id);

      const dataToUpdate: Prisma.CommentUpdateInput = { ...updateCommentDto };

      return await this.prisma.comment.update({
        where: { id },
        data: dataToUpdate,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error updating comment with ID ${id}:`, error);

      let message = `Не удалось обновить комментарий с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number) {
    try {
      const comment = await this.findOne(id);
      if (!comment) {
        return false;
      }
      await this.prisma.comment.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error removing comment with ID ${id}:`, error);

      let message = `Не удалось удалить комментарий с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }
}
