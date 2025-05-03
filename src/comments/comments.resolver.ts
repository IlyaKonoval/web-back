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

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private commentsService: CommentsService,
    private prisma: PrismaService,
  ) {}

  @Query(() => [Comment])
  async comments(
    @Args('skip', { nullable: true }) skip: number,
    @Args('take', { nullable: true }) take: number,
  ) {
    return this.commentsService.findAll(skip, take);
  }

  @Query(() => Comment)
  async comment(@Args('id') id: number) {
    const comment = await this.commentsService.findOne(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  @Query(() => [Comment])
  async commentsByProject(@Args('projectId') projectId: number) {
    return this.commentsService.findByProjectId(projectId);
  }

  @Query(() => [Comment])
  async commentsByUser(@Args('userId') userId: number) {
    return this.commentsService.findByUserId(userId);
  }

  @Mutation(() => Comment)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Args('input') input: CreateCommentInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.commentsService.create({
      text: input.comment,
      userId,
      projectId: input.projectId,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Args('id') id: number, @Context() context: any) {
    // You might want to add authorization logic here to check if the user owns the comment
    return this.commentsService.remove(id);
  }

  // Resolver field for comment author
  @ResolveField(() => User)
  async user(@Parent() comment: Comment) {
    return this.prisma.user.findUnique({
      where: { id: comment.userId },
    });
  }

  // Resolver field for comment's project
  @ResolveField(() => Project)
  async project(@Parent() comment: Comment) {
    return this.prisma.project.findUnique({
      where: { id: comment.projectId },
    });
  }
}
