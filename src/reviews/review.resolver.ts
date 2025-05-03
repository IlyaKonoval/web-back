import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import {
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Review, CreateReviewInput, UpdateReviewInput } from './review.model';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../auth/user.model';
import { Project } from '../projects/project.model';

@Resolver(() => Review)
export class ReviewResolver {
  constructor(
    private reviewsService: ReviewsService,
    private prisma: PrismaService,
  ) {}

  @Query(() => [Review])
  async reviews() {
    return this.reviewsService.findAll();
  }

  @Query(() => Review)
  async review(@Args('id') id: number) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  @Query(() => [Review])
  async reviewsByProject(@Args('projectId') projectId: number) {
    return this.reviewsService.findByProjectId(projectId);
  }

  @Query(() => [Review])
  async reviewsByUser(@Args('userId') userId: number) {
    return this.reviewsService.findByUserId(userId);
  }

  @Query(() => Int)
  async projectAverageRating(@Args('projectId') projectId: number) {
    return this.reviewsService.getProjectAverageRating(projectId);
  }

  @Mutation(() => Review)
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Args('input') input: CreateReviewInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;

    // Check if user already reviewed this project
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        projectId: input.projectId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this project');
    }

    return this.reviewsService.create({
      text: input.text,
      rating: input.rating,
      userId,
      projectId: input.projectId,
    });
  }

  @Mutation(() => Review)
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Args('id') id: number,
    @Args('input') input: UpdateReviewInput,
    @Context() context: any,
  ) {
    // You might want to add authorization logic here to check if the user owns the review
    return this.reviewsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Args('id') id: number, @Context() context: any) {
    // You might want to add authorization logic here to check if the user owns the review
    return this.reviewsService.remove(id);
  }

  // Resolver field for review author
  @ResolveField(() => User)
  async user(@Parent() review: Review) {
    return this.prisma.user.findUnique({
      where: { id: review.userId },
    });
  }

  // Resolver field for review's project
  @ResolveField(() => Project)
  async project(@Parent() review: Review) {
    return this.prisma.project.findUnique({
      where: { id: review.projectId },
    });
  }
}
