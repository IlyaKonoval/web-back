import { Field, ID, ObjectType, InputType } from '@nestjs/graphql';
import { User } from '../auth/user.model';
import { Comment } from '../comments/comment.type';
import { Review } from '../reviews/review.model';

@ObjectType({ description: 'Project object type' })
export class Project {
  @Field(() => ID, { description: 'The unique identifier of the project' })
  id: number;

  @Field({ description: 'The title of the project' })
  title: string;

  @Field({ description: 'The description of the project', nullable: true })
  description?: string;

  @Field({ description: 'The GitHub link of the project', nullable: true })
  githubLink?: string;

  @Field(() => User, { description: 'The user who created this project' })
  user: User;

  @Field(() => ID, {
    description: 'The ID of the user who created this project',
  })
  userId: number;

  @Field(() => [Comment], {
    description: 'Comments on this project',
    nullable: true,
  })
  comments?: Comment[];

  @Field(() => [Review], {
    description: 'Reviews of this project',
    nullable: true,
  })
  reviews?: Review[];
}

@InputType({ description: 'Input to create a new project' })
export class CreateProjectInput {
  @Field({ description: 'The title for the new project' })
  title: string;

  @Field({ description: 'The description for the new project', nullable: true })
  description?: string;

  @Field({ description: 'The GitHub link for the new project', nullable: true })
  githubLink?: string;
}

@InputType({ description: 'Input to update an existing project' })
export class UpdateProjectInput {
  @Field({ description: 'The updated title for the project', nullable: true })
  title?: string;

  @Field({
    description: 'The updated description for the project',
    nullable: true,
  })
  description?: string;

  @Field({
    description: 'The updated GitHub link for the project',
    nullable: true,
  })
  githubLink?: string;
}
