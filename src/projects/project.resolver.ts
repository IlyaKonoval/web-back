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

@Resolver(() => Project)
export class ProjectResolver {
  constructor(
    private projectsService: ProjectsService,
    private prisma: PrismaService,
  ) {}

  @Query(() => [Project])
  async projects() {
    return this.projectsService.findAll();
  }

  @Query(() => Project)
  async project(@Args('id') id: number) {
    const project = await this.projectsService.findOne(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  @Query(() => [Project])
  async projectsByUser(@Args('userId') userId: number) {
    return this.projectsService.findByUserId(userId);
  }

  @Mutation(() => Project)
  @UseGuards(JwtAuthGuard)
  async createProject(
    @Args('input') input: CreateProjectInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.projectsService.create({
      ...input,
      userId,
    });
  }

  @Mutation(() => Project)
  @UseGuards(JwtAuthGuard)
  async updateProject(
    @Args('id') id: number,
    @Args('input') input: UpdateProjectInput,
    @Context() context: any,
  ) {
    // You might want to add authorization logic here to check if the user owns the project
    return this.projectsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteProject(@Args('id') id: number, @Context() context: any) {
    // You might want to add authorization logic here to check if the user owns the project
    return this.projectsService.remove(id);
  }

  // Resolver field for project owner
  @ResolveField(() => User)
  async user(@Parent() project: Project) {
    return this.prisma.user.findUnique({
      where: { id: project.userId },
    });
  }

  // Resolver field for project comments
  @ResolveField(() => [Comment])
  async comments(@Parent() project: Project) {
    return this.prisma.comment.findMany({
      where: { projectId: project.id },
    });
  }

  // Resolver field for project reviews
  @ResolveField(() => [Review])
  async reviews(@Parent() project: Project) {
    return this.prisma.review.findMany({
      where: { projectId: project.id },
    });
  }
}
