import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Comment, Project } from '@prisma/client';

type CommentWithRelations = Comment & {
  user: {
    id: number;
    username: string;
  };
  project: {
    id: number;
    title: string;
  };
};

@ApiExcludeController()
@Controller('promise')
export class PromiseController {
  constructor(private prisma: PrismaService) {}

  @Get('')
  @Render('promise')
  async promise() {
    const isAuthenticated = true;
    console.log('isAuthenticated:', isAuthenticated);

    // Инициализируем массив с правильным типом
    const userProjects: Project[] = [];

    // Инициализируем массив комментариев с правильным типом
    let comments: CommentWithRelations[] = [];

    try {
      comments = await this.prisma.comment.findMany({
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              username: true,
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
      console.error('Error fetching comments:', error);
      comments = [];
    }

    return {
      title: 'Promise',
      bodyClass: 'promise-body',
      mainClass: 'promise-main',
      isAuthenticated,
      userProjects,
      comments,
    };
  }
}
