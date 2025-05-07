import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from './project.model';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../auth/user.model';
import { Comment } from '../comments/comment.type';
import { Review } from '../reviews/review.model';
import { Role as PrismaRole } from '@prisma/client';
import { Role } from '../auth/interfaces/user.interface';

// Define a type for GraphQL context
interface GqlContext {
  req: {
    user: {
      id: number;
      // Add other user properties if needed
    };
  };
}

@Resolver(() => Project)
export class ProjectResolver {
  constructor(
    private projectsService: ProjectsService,
    private prisma: PrismaService,
  ) {}

  @Query(() => [Project])
  async projects(): Promise<Project[]> {
    const dbProjects = await this.projectsService.findAll();

    // Map database projects to GraphQL model
    return dbProjects.map((project) => {
      const projectModel = new Project();
      projectModel.id = project.id;
      projectModel.title = project.title;
      projectModel.description = project.description ?? undefined;
      projectModel.githubLink = project.githubLink ?? undefined;
      projectModel.userId = project.userId;
      return projectModel;
    });
  }

  @Query(() => Project)
  async project(@Args('id') id: number): Promise<Project> {
    const dbProject = await this.projectsService.findOne(id);
    if (!dbProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Map database project to GraphQL model
    const projectModel = new Project();
    projectModel.id = dbProject.id;
    projectModel.title = dbProject.title;
    projectModel.description = dbProject.description ?? undefined;
    projectModel.githubLink = dbProject.githubLink ?? undefined;
    projectModel.userId = dbProject.userId;

    return projectModel;
  }

  @Query(() => [Project])
  async projectsByUser(@Args('userId') userId: number): Promise<Project[]> {
    const dbProjects = await this.projectsService.findByUserId(userId);

    // Map database projects to GraphQL model
    return dbProjects.map((project) => {
      const projectModel = new Project();
      projectModel.id = project.id;
      projectModel.title = project.title;
      projectModel.description = project.description ?? undefined;
      projectModel.githubLink = project.githubLink ?? undefined;
      projectModel.userId = project.userId;
      return projectModel;
    });
  }

  @Mutation(() => Project)
  @UseGuards(JwtAuthGuard)
  async createProject(
    @Args('input') input: CreateProjectInput,
    @Context() context: GqlContext,
  ): Promise<Project> {
    const userId = context.req.user.id;
    const dbProject = await this.projectsService.create({
      ...input,
      userId,
    });

    // Map database project to GraphQL model
    const projectModel = new Project();
    projectModel.id = dbProject.id;
    projectModel.title = dbProject.title;
    projectModel.description = dbProject.description ?? undefined;
    projectModel.githubLink = dbProject.githubLink ?? undefined;
    projectModel.userId = dbProject.userId;

    return projectModel;
  }

  @Mutation(() => Project)
  @UseGuards(JwtAuthGuard)
  async updateProject(
    @Args('id') id: number,
    @Args('input') input: UpdateProjectInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Context() context: GqlContext,
  ): Promise<Project> {
    // You might want to add authorization logic here to check if the user owns the project
    // const userId = context.req.user.id;

    const dbProject = await this.projectsService.update(id, input);

    // Map database project to GraphQL model
    const projectModel = new Project();
    projectModel.id = dbProject.id;
    projectModel.title = dbProject.title;
    projectModel.description = dbProject.description ?? undefined;
    projectModel.githubLink = dbProject.githubLink ?? undefined;
    projectModel.userId = dbProject.userId;

    return projectModel;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteProject(
    @Args('id') id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Context() context: GqlContext,
  ): Promise<boolean> {
    return this.projectsService.remove(id);
  }

  // Resolver field for project owner
  @ResolveField(() => User)
  async user(@Parent() project: Project): Promise<User> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: project.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        registrationDate: true,
        isGuest: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundException(`User with ID ${project.userId} not found`);
    }

    // Map database user to GraphQL model
    const userModel = new User();
    userModel.id = dbUser.id;
    userModel.username = dbUser.username;
    userModel.email = dbUser.email;
    // Convert Prisma Role to Application Role
    userModel.role = this.mapPrismaRoleToAppRole(dbUser.role);
    userModel.registrationDate = dbUser.registrationDate;
    userModel.isGuest = dbUser.isGuest ?? false;

    return userModel;
  }

  // Resolver field for project comments
  @ResolveField(() => [Comment])
  async comments(@Parent() project: Project): Promise<Comment[]> {
    const dbComments = await this.prisma.comment.findMany({
      where: { projectId: project.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isGuest: true,
            registrationDate: true,
          },
        },
      },
    });

    // Map database comments to GraphQL model
    return dbComments.map((comment) => {
      const commentModel = new Comment();
      commentModel.id = comment.id;
      commentModel.text = comment.text;
      commentModel.createdAt = comment.createdAt;
      commentModel.userId = comment.userId;
      commentModel.projectId = comment.projectId;

      if (comment.user) {
        const userModel = new User();
        userModel.id = comment.user.id;
        userModel.username = comment.user.username;
        userModel.email = comment.user.email;
        userModel.role = this.mapPrismaRoleToAppRole(comment.user.role);
        userModel.isGuest = comment.user.isGuest ?? false;
        userModel.registrationDate = comment.user.registrationDate ?? undefined;
        commentModel.user = userModel;
      }

      return commentModel;
    });
  }

  // Resolver field for project reviews
  @ResolveField(() => [Review])
  async reviews(@Parent() project: Project): Promise<Review[]> {
    const dbReviews = await this.prisma.review.findMany({
      where: { projectId: project.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isGuest: true,
            registrationDate: true,
          },
        },
      },
    });

    // Map database reviews to GraphQL model
    return dbReviews.map((review) => {
      const reviewModel = new Review();
      reviewModel.id = review.id;
      reviewModel.text = review.text;
      reviewModel.rating = review.rating;
      reviewModel.createdAt = review.createdAt;
      reviewModel.userId = review.userId;
      reviewModel.projectId = review.projectId;

      if (review.user) {
        const userModel = new User();
        userModel.id = review.user.id;
        userModel.username = review.user.username;
        userModel.email = review.user.email;
        userModel.role = this.mapPrismaRoleToAppRole(review.user.role);
        userModel.isGuest = review.user.isGuest ?? false;
        userModel.registrationDate = review.user.registrationDate ?? undefined;
        reviewModel.user = userModel;
      }

      return reviewModel;
    });
  }

  // Helper method to map Prisma Role to Application Role
  private mapPrismaRoleToAppRole(prismaRole: PrismaRole): Role {
    if (prismaRole === PrismaRole.USER) {
      return Role.USER;
    } else if (prismaRole === PrismaRole.ADMIN) {
      return Role.ADMIN;
    }
    // Default to USER if the role doesn't match
    return Role.USER;
  }
}
