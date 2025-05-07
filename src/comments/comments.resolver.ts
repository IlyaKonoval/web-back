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
import { Comment, CreateCommentInput } from './comment.type';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../auth/user.model';
import { Project } from '../projects/project.model';
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

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private commentsService: CommentsService,
    private prisma: PrismaService,
  ) {}

  @Query(() => [Comment])
  async comments(
    @Args('skip', { nullable: true }) skip?: number,
    @Args('take', { nullable: true }) take?: number,
  ): Promise<Comment[]> {
    const dbComments = await this.commentsService.findAll(skip, take);

    // Map database comments to GraphQL model
    return dbComments.map((comment) => {
      const commentModel = new Comment();
      commentModel.id = comment.id;
      commentModel.text = comment.text;
      commentModel.createdAt = comment.createdAt;
      commentModel.userId = comment.userId;
      commentModel.projectId = comment.projectId;
      return commentModel;
    });
  }

  @Query(() => Comment)
  async comment(@Args('id') id: number): Promise<Comment> {
    const dbComment = await this.commentsService.findOne(id);
    if (!dbComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Map database comment to GraphQL model
    const commentModel = new Comment();
    commentModel.id = dbComment.id;
    commentModel.text = dbComment.text;
    commentModel.createdAt = dbComment.createdAt;
    commentModel.userId = dbComment.userId;
    commentModel.projectId = dbComment.projectId;

    return commentModel;
  }

  @Query(() => [Comment])
  async commentsByProject(
    @Args('projectId') projectId: number,
  ): Promise<Comment[]> {
    const dbComments = await this.commentsService.findByProjectId(projectId);

    // Map database comments to GraphQL model
    return dbComments.map((comment) => {
      const commentModel = new Comment();
      commentModel.id = comment.id;
      commentModel.text = comment.text;
      commentModel.createdAt = comment.createdAt;
      commentModel.userId = comment.userId;
      commentModel.projectId = comment.projectId;
      return commentModel;
    });
  }

  @Query(() => [Comment])
  async commentsByUser(@Args('userId') userId: number): Promise<Comment[]> {
    const dbComments = await this.commentsService.findByUserId(userId);

    // Map database comments to GraphQL model
    return dbComments.map((comment) => {
      const commentModel = new Comment();
      commentModel.id = comment.id;
      commentModel.text = comment.text;
      commentModel.createdAt = comment.createdAt;
      commentModel.userId = comment.userId;
      commentModel.projectId = comment.projectId;
      return commentModel;
    });
  }

  @Mutation(() => Comment)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Args('input') input: CreateCommentInput,
    @Context() context: GqlContext,
  ): Promise<Comment> {
    const userId = context.req.user.id;
    const dbComment = await this.commentsService.create({
      text: input.comment,
      userId,
      projectId: input.projectId,
    });

    // Map database comment to GraphQL model
    const commentModel = new Comment();
    commentModel.id = dbComment.id;
    commentModel.text = dbComment.text;
    commentModel.createdAt = dbComment.createdAt;
    commentModel.userId = dbComment.userId;
    commentModel.projectId = dbComment.projectId;

    return commentModel;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Args('id') id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Context() context: GqlContext,
  ): Promise<boolean> {
    // You might want to add authorization logic here to check if the user owns the comment
    // const userId = context.req.user.id;

    return this.commentsService.remove(id);
  }

  // Resolver field for comment author
  @ResolveField(() => User)
  async user(@Parent() comment: Comment): Promise<User> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: comment.userId },
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
      throw new NotFoundException(`User with ID ${comment.userId} not found`);
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

  // Resolver field for comment's project
  @ResolveField(() => Project)
  async project(@Parent() comment: Comment): Promise<Project> {
    const dbProject = await this.prisma.project.findUnique({
      where: { id: comment.projectId },
      select: {
        id: true,
        title: true,
        description: true,
        githubLink: true,
        userId: true,
      },
    });

    if (!dbProject) {
      throw new NotFoundException(
        `Project with ID ${comment.projectId} not found`,
      );
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
