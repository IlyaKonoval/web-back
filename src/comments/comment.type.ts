import { Field, ID, ObjectType, InputType } from '@nestjs/graphql';
import { User } from '../auth/user.model';
import { Project } from '../projects/project.model';

@ObjectType({ description: 'Comment object type' })
export class Comment {
  @Field(() => ID, { description: 'The unique identifier of the comment' })
  id: number;

  @Field({ description: 'The text content of the comment' })
  text: string;

  @Field({ description: 'The date when the comment was created' })
  createdAt: Date;

  @Field(() => User, { description: 'The user who created this comment' })
  user: User;

  @Field(() => ID, {
    description: 'The ID of the user who created this comment',
  })
  userId: number;

  @Field(() => Project, { description: 'The project this comment belongs to' })
  project: Project;

  @Field(() => ID, {
    description: 'The ID of the project this comment belongs to',
  })
  projectId: number;
}

@InputType({ description: 'Input to create a new comment' })
export class CreateCommentInput {
  @Field({ description: 'The text content of the comment' })
  comment: string;

  @Field(() => ID, {
    description: 'The ID of the project this comment belongs to',
  })
  projectId: number;
}
