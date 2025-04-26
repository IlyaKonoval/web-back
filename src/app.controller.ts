import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('/')
  @Render('index')
  root() {
    return {
      title: 'Personal Portfolio Website',
      bodyClass: 'index-body',
      mainClass: 'index-main',
    };
  }

  @Public()
  @Get('/index')
  @Render('index')
  index() {
    return {
      title: 'Personal Portfolio Website',
      bodyClass: 'index-body',
      mainClass: 'index-main',
    };
  }

  @Public()
  @Get('/portfolio')
  @Render('portfolio')
  async portfolio() {
    const projects = await this.prisma.project.findMany({
      take: 6,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return {
      title: 'Portfolio',
      bodyClass: 'portfolio-body',
      mainClass: 'portfolio-main',
      projects,
    };
  }
}
