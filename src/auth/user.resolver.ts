import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { User } from './user.model';
import { CreateUserInput } from './create-user.input';
import { RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Project } from '../projects/project.model';
import { Comment } from '../comments/comment.type';
import { Role as PrismaRole } from '@prisma/client';
import { Role } from './interfaces/user.interface';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    const dbUsers = await this.authService.getAllUsers();

    // Преобразуем в GraphQL модель
    return dbUsers.map((user) => {
      const userModel = new User();
      userModel.id = user.id;
      userModel.email = user.email;
      userModel.username = user.username;
      // Преобразуем Prisma Role в GraphQL Role
      userModel.role = this.mapPrismaRoleToAppRole(user.role);
      userModel.registrationDate = user.registrationDate;
      userModel.isGuest = user.isGuest ?? false;
      return userModel;
    });
  }

  @Query(() => User)
  async user(@Args('id') id: number): Promise<User> {
    const dbUser = await this.authService.getUserById(id);
    if (!dbUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Преобразуем в GraphQL модель
    const userModel = new User();
    userModel.id = dbUser.id;
    userModel.email = dbUser.email;
    userModel.username = dbUser.username;
    // Преобразуем Prisma Role в GraphQL Role
    userModel.role = this.mapPrismaRoleToAppRole(dbUser.role);
    userModel.registrationDate = dbUser.registrationDate;
    userModel.isGuest = dbUser.isGuest ?? false;

    return userModel;
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    const registerDto: RegisterDto = {
      email: input.email,
      password: input.password,
      confirmPassword: input.confirmPassword ?? input.password,
      username: input.username,
    };

    const dbUser = await this.authService.register(registerDto);

    // Преобразуем в GraphQL модель
    const userModel = new User();
    userModel.id = dbUser.id;
    userModel.email = dbUser.email;
    userModel.username = dbUser.username;
    // Преобразуем Prisma Role в GraphQL Role
    userModel.role = this.mapPrismaRoleToAppRole(dbUser.role);
    userModel.registrationDate = dbUser.registrationDate;
    userModel.isGuest = dbUser.isGuest ?? false;

    return userModel;
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Args('id') id: number): Promise<string> {
    await this.authService.deleteUser(id);
    return 'User deleted successfully';
  }

  @ResolveField(() => [Project])
  async projects(@Parent() user: User): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isGuest: true,
          },
        },
      },
    });

    return projects.map((project) => {
      const projectModel = new Project();
      projectModel.id = project.id;
      projectModel.title = project.title;
      // Handle null values from database (convert to undefined)
      projectModel.description = project.description ?? undefined;
      projectModel.githubLink = project.githubLink ?? undefined;
      projectModel.userId = project.userId;

      if (project.user) {
        const userModel = new User();
        userModel.id = project.user.id;
        userModel.username = project.user.username;
        userModel.email = project.user.email;
        // Преобразуем Prisma Role в GraphQL Role
        userModel.role = this.mapPrismaRoleToAppRole(project.user.role);
        userModel.isGuest = project.user.isGuest ?? false;
        projectModel.user = userModel;
      }

      return projectModel;
    });
  }

  @ResolveField(() => [Comment])
  async comments(@Parent() user: User): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isGuest: true,
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

    return comments.map((comment) => {
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
        // Преобразуем Prisma Role в GraphQL Role
        userModel.role = this.mapPrismaRoleToAppRole(comment.user.role);
        userModel.isGuest = comment.user.isGuest ?? false;
        commentModel.user = userModel;
      }

      if (comment.project) {
        const projectModel = new Project();
        projectModel.id = comment.project.id;
        projectModel.title = comment.project.title;
        commentModel.project = projectModel;
      }

      return commentModel;
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
