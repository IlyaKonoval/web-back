import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Render,
  Res,
  Req,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Response, Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithSession extends Request {
  session?: SessionContainer;
}

// Интерфейсы для входных данных форм
interface ProjectFormData {
  title: string;
  description?: string;
  githubLink?: string;
}

@ApiExcludeController()
@Controller('projects')
export class ProjectsViewController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @Render('projects/index')
  async allProjects() {
    try {
      const projects = await this.projectsService.findAll();

      return {
        title: 'All Projects',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        projects,
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return {
        title: 'Error',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        projects: [],
        error: 'Failed to load projects',
      };
    }
  }

  @Get('create')
  @Render('projects/create')
  createProjectForm() {
    return {
      title: 'Create New Project',
      bodyClass: 'bg-gray-100',
      mainClass: 'container mx-auto py-8',
      errorMessage: null,
    };
  }

  @Post('create')
  async createProject(
    @Body() createData: ProjectFormData,
    @Req() req: RequestWithSession,
    @Res() res: Response,
  ) {
    try {
      if (!req.session) {
        return res.redirect('/auth/signin');
      }

      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user) {
        return res.redirect('/auth/signin');
      }

      // Исправлено: используйте undefined вместо null для соответствия типам DTO
      const projectData: CreateProjectDto = {
        title: createData.title,
        description: createData.description || undefined,
        githubLink: createData.githubLink || undefined,
        userId: user.id,
      };

      await this.projectsService.create(projectData);
      return res.redirect('/projects/my');
    } catch (error) {
      console.error('Error creating project:', error);
      return res.render('projects/create', {
        title: 'Create New Project',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        errorMessage: 'Failed to create project',
        formData: createData,
      });
    }
  }

  @Get('my')
  @Render('projects/my-projects')
  async myProjects(@Req() req: RequestWithSession, @Res() res: Response) {
    if (!req.session) {
      return res.redirect('/auth/signin');
    }

    try {
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user) {
        return res.redirect('/auth/signin');
      }

      const projects = await this.projectsService.findByUserId(user.id);

      return {
        title: 'My Projects',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        projects,
      };
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return {
        title: 'My Projects',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        projects: [],
        errorMessage: 'Failed to load your projects',
      };
    }
  }

  @Get(':id')
  @Public()
  @Render('projects/detail')
  async projectDetail(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithSession,
  ) {
    try {
      const project = await this.projectsService.findOne(id);
      const comments = await this.prisma.comment.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let isOwner = false;
      if (req.session) {
        const userEmail = req.session.getUserId();
        const user = await this.prisma.user.findFirst({
          where: { email: userEmail },
        });

        if (user) {
          isOwner = user.id === project.userId;
        }
      }

      return {
        title: project.title,
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        project,
        comments,
        isOwner,
      };
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }

  @Get('edit/:id')
  @Render('projects/edit')
  async editProjectForm(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithSession,
    @Res() res: Response,
  ) {
    if (!req.session) {
      return res.redirect('/auth/signin');
    }

    try {
      const project = await this.projectsService.findOne(id);
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user || (user.id !== project.userId && user.role !== 'ADMIN')) {
        return res.redirect('/projects');
      }

      return {
        title: 'Edit Project',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        project,
        errorMessage: null,
      };
    } catch (error) {
      console.error(`Error fetching project ${id} for edit:`, error);
      return res.redirect('/projects');
    }
  }

  @Post('edit/:id')
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: ProjectFormData,
    @Req() req: RequestWithSession,
    @Res() res: Response,
  ) {
    if (!req.session) {
      return res.redirect('/auth/signin');
    }

    try {
      const project = await this.projectsService.findOne(id);
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user || (user.id !== project.userId && user.role !== 'ADMIN')) {
        return res.redirect('/projects');
      }

      // Исправлено: убедитесь, что типы соответствуют ожиданиям DTO
      const projectData: UpdateProjectDto = {
        title: updateData.title,
        description: updateData.description,
        githubLink: updateData.githubLink,
      };

      await this.projectsService.update(id, projectData);
      return res.redirect(`/projects/${id}`);
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      return res.render('projects/edit', {
        title: 'Edit Project',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        project: { id, ...updateData },
        errorMessage: 'Failed to update project',
      });
    }
  }

  @Post('delete/:id')
  async deleteProject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithSession,
    @Res() res: Response,
  ) {
    if (!req.session) {
      return res.redirect('/auth/signin');
    }

    try {
      const project = await this.projectsService.findOne(id);
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user || (user.id !== project.userId && user.role !== 'ADMIN')) {
        return res.redirect('/projects');
      }

      await this.projectsService.remove(id);
      return res.redirect('/projects/my');
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      return res.redirect('/projects/my?error=Failed to delete project');
    }
  }
}
