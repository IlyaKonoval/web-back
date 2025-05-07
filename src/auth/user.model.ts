import { Field, ID, ObjectType, InputType } from '@nestjs/graphql';
import { Role } from './role.enum';

@ObjectType({ description: 'User object type' })
export class User {
  @Field(() => ID, { description: 'The unique identifier of the user' })
  id: number;

  @Field({ description: 'The username of the user' })
  username: string;

  @Field({ description: 'The email address of the user' })
  email: string;

  @Field(() => Role, { description: 'The role of the user' })
  role: Role;

  @Field({ description: 'The date when the user registered', nullable: true })
  registrationDate?: Date;

  @Field({
    description: 'Whether the user is a guest user',
    defaultValue: false,
  })
  isGuest: boolean = false;

  @Field(() => [Project], {
    description: 'Projects created by the user',
    nullable: true,
  })
  projects?: Project[];

  @Field(() => [Comment], {
    description: 'Comments made by the user',
    nullable: true,
  })
  comments?: Comment[];
}

@InputType({ description: 'Input to create a new user' })
export class CreateUserInput {
  @Field({ description: 'The username for the new user' })
  username: string;

  @Field({ description: 'The email address for the new user' })
  email: string;

  @Field({ description: 'The password for the new user' })
  password: string;

  @Field({ description: 'Confirm the password', nullable: true })
  confirmPassword?: string;
}

import { Project } from '../projects/project.model';
import { Comment } from '../comments/comment.type';
