import { Field, ID, ObjectType, InputType, Int } from '@nestjs/graphql';
import { User } from '../auth/user.model';
import { Project } from '../projects/project.model';
import { Max, Min } from 'class-validator';

@ObjectType({ description: 'Review object type' })
export class Review {
  @Field(() => ID, { description: 'The unique identifier of the review' })
  id: number;

  @Field({ description: 'The text content of the review' })
  text: string;

  @Field(() => Int, { description: 'The rating given in the review (1-5)' })
  rating: number;

  @Field({ description: 'The date when the review was created' })
  createdAt: Date;

  @Field(() => User, { description: 'The user who created this review' })
  user: User;

  @Field(() => ID, {
    description: 'The ID of the user who created this review',
  })
  userId: number;

  @Field(() => Project, { description: 'The project this review belongs to' })
  project: Project;

  @Field(() => ID, {
    description: 'The ID of the project this review belongs to',
  })
  projectId: number;
}

@InputType({ description: 'Input to create a new review' })
export class CreateReviewInput {
  @Field({ description: 'The text content of the review' })
  text: string;

  @Field(() => Int, { description: 'The rating given in the review (1-5)' })
  @Min(1)
  @Max(5)
  rating: number;

  @Field(() => ID, {
    description: 'The ID of the project this review belongs to',
  })
  projectId: number;
}

@InputType({ description: 'Input to update an existing review' })
export class UpdateReviewInput {
  @Field({
    description: 'The updated text content of the review',
    nullable: true,
  })
  text?: string;

  @Field(() => Int, {
    description: 'The updated rating given in the review (1-5)',
    nullable: true,
  })
  @Min(1)
  @Max(5)
  rating?: number;
}
