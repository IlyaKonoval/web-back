import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    try {
      const existingReview = await this.prisma.review.findFirst({
        where: {
          userId: createReviewDto.userId,
          projectId: createReviewDto.projectId,
        },
      });

      if (existingReview) {
        throw new ConflictException(
          'Вы уже оставили отзыв для этого проекта. Вы можете обновить существующий отзыв.',
        );
      }

      const review = await this.prisma.review.create({
        data: {
          text: createReviewDto.text,
          rating: createReviewDto.rating,
          userId: createReviewDto.userId,
          projectId: createReviewDto.projectId,
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
      return review;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      console.error('Error creating review:', error);
      let message = 'Не удалось создать отзыв.';
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findAll() {
    try {
      return this.prisma.review.findMany({
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
      console.error('Error finding all reviews:', error);
      throw new InternalServerErrorException(
        'Не удалось получить список отзывов.',
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
        this.prisma.review.findMany({
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
        this.prisma.review.count(),
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
        'Не удалось получить отзывы с пагинацией.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const review = await this.prisma.review.findUnique({
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

      if (!review) {
        throw new NotFoundException(`Отзыв с ID ${id} не найден.`);
      }
      return review;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error finding review with ID ${id}:`, error);

      let message = `Не удалось найти отзыв с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findByProjectId(projectId: number) {
    try {
      const reviews = await this.prisma.review.findMany({
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
      return reviews;
    } catch (error) {
      console.error(`Error finding reviews for project ${projectId}:`, error);
      let message = `Не удалось найти отзывы для проекта с ID ${projectId}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findByUserId(userId: number) {
    try {
      const reviews = await this.prisma.review.findMany({
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
      return reviews;
    } catch (error) {
      console.error(`Error finding reviews for user ${userId}:`, error);
      let message = `Не удалось найти отзывы пользователя с ID ${userId}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async getProjectAverageRating(projectId: number): Promise<number> {
    try {
      const result = await this.prisma.review.aggregate({
        where: {
          projectId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      });

      if (!result._avg.rating) {
        return 0;
      }

      return Number(result._avg.rating.toFixed(1));
    } catch (error) {
      console.error(
        `Error calculating average rating for project ${projectId}:`,
        error,
      );
      throw new InternalServerErrorException(
        `Не удалось рассчитать средний рейтинг для проекта с ID ${projectId}.`,
      );
    }
  }

  async update(id: number, updateReviewDto: UpdateReviewDto) {
    try {
      await this.findOne(id);

      const dataToUpdate: Prisma.ReviewUpdateInput = { ...updateReviewDto };

      return await this.prisma.review.update({
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

      console.error(`Error updating review with ID ${id}:`, error);

      let message = `Не удалось обновить отзыв с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number) {
    try {
      const review = await this.findOne(id);
      if (!review) {
        return false;
      }
      await this.prisma.review.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error removing review with ID ${id}:`, error);

      let message = `Не удалось удалить отзыв с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }
}
