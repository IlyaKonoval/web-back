import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      const project = await this.prisma.project.create({
        data: {
          title: createProjectDto.title,
          description: createProjectDto.description,
          githubLink: createProjectDto.githubLink,
          userId: createProjectDto.userId,
        },
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
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      let message = 'Не удалось создать проект.';
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findAll() {
    try {
      return this.prisma.project.findMany({
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
      console.error('Error finding all projects:', error);
      throw new InternalServerErrorException(
        'Не удалось получить список проектов.',
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
        this.prisma.project.findMany({
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
        this.prisma.project.count(),
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
        'Не удалось получить проекты с пагинацией.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          comments: true,
          reviews: true,
        },
      });

      if (!project) {
        throw new NotFoundException(`Проект с ID ${id} не найден.`);
      }
      return project;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error finding project with ID ${id}:`, error);

      let message = `Не удалось найти проект с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async findByUserId(userId: number) {
    try {
      const projects = await this.prisma.project.findMany({
        where: { userId },
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
      return projects;
    } catch (error) {
      console.error(`Error finding projects for user ${userId}:`, error);
      let message = `Не удалось найти проекты пользователя с ID ${userId}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    try {
      await this.findOne(id);

      const dataToUpdate: Prisma.ProjectUpdateInput = { ...updateProjectDto };

      return await this.prisma.project.update({
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
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error updating project with ID ${id}:`, error);

      let message = `Не удалось обновить проект с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number) {
    try {
      const project = await this.findOne(id);
      if (!project) {
        return false;
      }
      await this.prisma.project.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error removing project with ID ${id}:`, error);

      let message = `Не удалось удалить проект с ID ${id}.`;
      if (error instanceof Error) {
        message = error.message;
      }
      throw new InternalServerErrorException(message);
    }
  }
}
